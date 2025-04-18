from fastapi import APIRouter, WebSocket, HTTPException
from fastapi.websockets import WebSocketDisconnect
from app.core.config import settings
from app.utils.twilio import TWILIO_CLIENT
from app.core.logger import logger
from app.services.call import (
    call_state,
    manager,
    initialize_session,
    process_openai_messages,
    handle_twilio_connection,
    process_twilio_messages,
    monitor_silence,
    send_initial_greeting
)
from app.services.invoice import invoice_service
from app.services.record import record_service
from app.model.record import RecordCreate
from openai import OpenAI
from pydantic import BaseModel
import websockets
import asyncio

router = APIRouter(prefix="/twilio", tags=["call"])

OPENAI_CLIENT = OpenAI(api_key=settings.openai_api_key)

class OutboundRequest(BaseModel):
    invoice_number: str

@router.post("/outbound")
async def outbound(request: OutboundRequest) -> str:
    """Initiate an outbound call to the invoice's mobile number."""
    try:
        invoice = await invoice_service.get_invoice(request.invoice_number)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        if not invoice.mobile_number:
            raise HTTPException(status_code=400, detail="No mobile number provided")

        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Response><Connect>'
            f'<Stream url="wss://{settings.fastapi_domain}/twilio/media-stream"/>'
            '</Connect></Response>'
        )
        call = TWILIO_CLIENT.calls.create(
            from_="+447366532747",
            to=invoice.mobile_number,
            twiml=twiml
        )
        logger.info(f"Now calling to {invoice.mobile_number} with SID {call.sid}")
        print("invoice", invoice)
        invoice.status = "calling"

        call_state.invoices[call.sid] = invoice.model_dump()
        call_state.initialize_call(call.sid)  # Initialize per-call state
        await invoice_service.update_invoice_status(invoice.invoice_number, invoice.status)
        settings.call_count += 1
        # Poll for call status (could be optimized with webhook)
        isrecording = False
        recording = None
        while True:
            data = TWILIO_CLIENT.calls(call.sid).fetch()
            if data.status == 'in-progress' and not isrecording:
                isrecording = True
                recording = TWILIO_CLIENT.calls(call.sid).recordings.create()
                logger.info(f"Recording started: {recording}")
            if data.status in ['failed', 'busy', 'no-answer', 'canceled']:
                logger.info(f"Call ended with status: {data.status}")
                await record_service.create_record(RecordCreate(
                    invoice_number=invoice.invoice_number,
                    duration=0,
                    transcript="",
                    audio_url="",
                    status=data.status
                ))
                await invoice_service.update_invoice_status(invoice.invoice_number, data.status)
                call_state.cleanup_call(call.sid)  # Clean up call state
                break
            if data.status == 'completed':
                logger.info(f"Call completed successfully: {recording}")
                print("Call is completed", call_state.invoices.get(call.sid, {}))
                await record_service.create_record(RecordCreate(
                    invoice_number=invoice.invoice_number,
                    duration=int(data.duration),
                    transcript=call_state.invoices.get(call.sid, {}).get('script', "") or "",
                    audio_url=f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Recordings/{recording.sid}" if recording else "",
                    status=data.status
                ))
                await invoice_service.update_invoice_status(invoice.invoice_number, data.status)
                call_state.cleanup_call(call.sid)  # Clean up call state
                break
            await asyncio.sleep(2)
        settings.call_count -= 1
        logger.info(f"Call initiated - SID: {call.sid}")
        return call.sid
    except asyncio.CancelledError:
        call_state.cleanup_call(call.sid)  # Clean up on cancellation
        return
    except Exception as e:
        logger.error(f"Error initiating call: {e}")
        call_state.cleanup_call(call.sid)  # Clean up on error
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/media-stream")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """WebSocket endpoint for streaming media between Twilio and OpenAI."""
    openai_ws = None
    callSid = None
    try:
        await manager.connect(websocket)
        data = await handle_twilio_connection(websocket)
        print("data", data)
        if not data:
            return
        callSid = data['callSid']
        async with websockets.connect('wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17', additional_headers={
            "Authorization": f"Bearer {settings.openai_api_key}",
            "OpenAI-Beta": "realtime=v1"
        }) as openai_ws:
            if call_state.invoices[callSid].get('script') is None:
                call_state.invoices[callSid]['script'] = ""
            await initialize_session(openai_ws, call_state.invoices.get(callSid, {}))
            await send_initial_greeting(openai_ws, callSid)
            await asyncio.gather(
                process_twilio_messages(websocket, openai_ws),
                process_openai_messages(websocket, openai_ws, data),
                monitor_silence(openai_ws, callSid)  # Monitor silence for this call
            )
    except (WebSocketDisconnect, ValueError) as e:
        logger.warning(f"WebSocket disconnected for call {callSid}: {e}")
        if callSid:
            call_state.cleanup_call(callSid)  # Clean up on disconnect
    except asyncio.CancelledError:
        if callSid:
            call_state.cleanup_call(callSid)  # Clean up on cancellation
        return
    except Exception as e:
        logger.error(f"Error in websocket_endpoint for call {callSid}: {e}", exc_info=True)
        if callSid:
            call_state.cleanup_call(callSid)  # Clean up on error
    finally:
        await manager.disconnect(websocket)

class ControlCallRequest(BaseModel):
    control_type: str

@router.post("/control_call")
async def control_call(request: ControlCallRequest):
    if request.control_type == "start_call":
        settings.active = True
        while settings.active:
            print(settings.active)
            invoices = await invoice_service.get_invoices_to_process()
            print("invoices", invoices)
            if not invoices:
                settings.active = False
                return {"status": "no_invoices", "message": "No invoices to process"}
            
            # Wait until we have available slots
            while settings.call_count >= 10:
                await asyncio.sleep(1)

            tasks = []
            # Process up to 10 invoices at a time
            for invoice in invoices:
                if settings.call_count >= 10:
                    break
                    
                try:
                    print("start_call", invoice)
                    # Create outbound request for each invoice
                    request = OutboundRequest(invoice_number=invoice.invoice_number)
                    task = outbound(request)
                    tasks.append(task)
                except Exception as e:
                    logger.error(f"Error initiating call for invoice {invoice.invoice_number}: {e}")
                    continue
            
            await asyncio.gather(*tasks)

    elif request.control_type == "stop_call":
        print("stop_call")
        # Reset call count and return current state
        settings.active = False
        return {"status": "stopped", "message": f"Stopped {settings.call_count} active calls"}
    
    else:
        raise HTTPException(status_code=400, detail="Invalid control_type. Use 'start_call' or 'stop_call'")
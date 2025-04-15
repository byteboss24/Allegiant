from fastapi import APIRouter, WebSocket, HTTPException
from fastapi.websockets import WebSocketDisconnect
from app.core.config import settings
from twilio.rest import Client
from app.core.logger import logger
from app.services.call import (
    call_state,
    manager,
    initialize_session,
    process_openai_messages,
    handle_twilio_connection,
    process_twilio_messages,
    monitor_speech,
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

TWILIO_CLIENT = Client(settings.twilio_account_sid, settings.twilio_auth_token)
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
        call_state.current_invoice = invoice.model_dump()

        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Response><Connect>'
            f'<Stream url="wss://{settings.fastapi_domain}/twilio/media-stream"/>'
            '</Connect></Response>'
        )
        call = TWILIO_CLIENT.calls.create(
            from_="+441925596272",
            to=invoice.mobile_number,
            twiml=twiml
        )
        logger.info(f"Now calling to {invoice.mobile_number} with SID {call.sid}")
        invoice.status = "calling"
        await invoice_service.update_invoice(invoice.invoice_number, invoice)
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
                invoice.status = data.status
                await invoice_service.update_invoice(invoice.invoice_number, invoice)
                break
            if data.status == 'completed':
                logger.info(f"Call completed successfully: {recording}")
                await record_service.create_record(RecordCreate(
                    invoice_number=invoice.invoice_number,
                    duration=int(data.duration),
                    transcript="",
                    audio_url=f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Recordings/{recording.sid}" if recording else "",
                    status=data.status
                ))
                invoice.status = data.status
                await invoice_service.update_invoice(invoice.invoice_number, invoice)
                break
            await asyncio.sleep(2)
        settings.call_count -= 1
        logger.info(f"Call initiated - SID: {call.sid}")
        return call.sid
    except asyncio.CancelledError:
        return
    except Exception as e:
        logger.error(f"Error initiating call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/media-stream")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """WebSocket endpoint for streaming media between Twilio and OpenAI."""
    openai_ws = None
    try:
        await manager.connect(websocket)
        stream_sid = await handle_twilio_connection(websocket)
        if not stream_sid:
            return
        async with websockets.connect(settings.openai_ws_url, extra_headers={"Authorization": f"Bearer {settings.openai_api_key}"}) as openai_ws:
            await initialize_session(openai_ws, call_state.current_invoice or {})
            await send_initial_greeting(openai_ws)
            await asyncio.gather(
                process_twilio_messages(websocket, openai_ws),
                process_openai_messages(websocket, openai_ws, stream_sid),
                monitor_speech(websocket, openai_ws)
            )
    except (WebSocketDisconnect, ValueError) as e:
        logger.warning(f"WebSocket disconnected: {e}")
    except asyncio.CancelledError:
        return
    except Exception as e:
        logger.error(f"Error in websocket_endpoint: {e}", exc_info=True)
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
                    # task = outbound(request)
                    # tasks.append(task)
                    # await asyncio.gather(*tasks)
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
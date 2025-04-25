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
import datetime
import pytz

router = APIRouter(prefix="/twilio", tags=["call"])

OPENAI_CLIENT = OpenAI(api_key=settings.openai_api_key)

class OutboundRequest(BaseModel):
    invoice_number: str

@router.post("/outbound")
async def outbound(request: OutboundRequest) -> str:
    """Initiate an outbound call to the invoice's mobile number."""
    call = None
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
                record_status = data.status
                await record_service.create_record(RecordCreate(
                    invoice_number=invoice.invoice_number,
                    duration=0,
                    transcript="",
                    audio_url="",
                    status=record_status
                ))
                await invoice_service.update_invoice_status(invoice.invoice_number, record_status)
                call_state.cleanup_call(call.sid)
                break
            if data.status == 'completed':
                logger.info(f"Call completed successfully: {recording}")
                print("Call is completed", call_state.invoices.get(call.sid, {}), call_state.invoices)
                record_status = data.status
                if call_state.invoices[call.sid]['status'] == 'sms':
                    record_status = 'sms'
                await record_service.create_record(RecordCreate(
                    invoice_number=invoice.invoice_number,
                    duration=int(data.duration),
                    transcript=call_state.invoices.get(call.sid, {}).get('script', "") or "",
                    audio_url=f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Recordings/{recording.sid}" if recording else "",
                    status=record_status
                ))
                await invoice_service.update_invoice_status(invoice.invoice_number, record_status)
                call_state.cleanup_call(call.sid)
                break
            await asyncio.sleep(2)
        settings.call_count -= 1
        logger.info(f"Call initiated - SID: {call.sid}")
        return call.sid
    except asyncio.CancelledError:
        if call:
            call_state.cleanup_call(call.sid)  # Clean up on cancellation
        return
    except Exception as e:
        logger.error(f"Error initiating call: {e}")
        if call:
            call_state.cleanup_call(call.sid)  # Clean up on error
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/media-stream")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """WebSocket endpoint for streaming media between Twilio and OpenAI."""
    openai_ws = None
    callSid = None
    print("Connected")
    try:
        await manager.connect(websocket)
        data = await handle_twilio_connection(websocket)
        print("data", data)
        if not data:
            return
        callSid = data['callSid']
        print("callsid", callSid, call_state.invoices.get(callSid, {}))
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
        semaphore = asyncio.Semaphore(10)
        async def process_invoice(invoice):
            async with semaphore:
                try:
                    request_obj = OutboundRequest(invoice_number=invoice.invoice_number)
                    await outbound(request_obj)
                except Exception as e:
                    logger.error(f"Error initiating call for invoice {invoice.invoice_number}: {e}")

        while settings.active:
            # Time window check (Europe/London 09:00-18:00)
            tz = pytz.timezone('Europe/London')
            now = datetime.datetime.now(tz)
            start = now.replace(hour=9, minute=0, second=0, microsecond=0)
            end = now.replace(hour=18, minute=0, second=0, microsecond=0)
            if not (start <= now < end):
                # Calculate seconds until next 9:00
                if now >= end:
                    # After 18:00, wait until next day 9:00
                    next_start = (now + datetime.timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0)
                else:
                    # Before 9:00 today
                    next_start = start
                sleep_seconds = (next_start - now).total_seconds()
                logger.info(f"Outside call window, sleeping for {sleep_seconds} seconds until {next_start}")
                await asyncio.sleep(sleep_seconds)
                continue
            invoices = await invoice_service.get_invoices_to_process()
            if not invoices:
                settings.active = False
                return {"status": "no_invoices", "message": "No invoices to process"}
            tasks = [process_invoice(invoice) for invoice in invoices]
            await asyncio.gather(*tasks)
            # Optionally, add a sleep or wait for new invoices
            # await asyncio.sleep(1)

    elif request.control_type == "stop_call":
        settings.active = False
        return {"status": "stopped", "message": f"Stopped {settings.call_count} active calls"}
    else:
        raise HTTPException(status_code=400, detail="Invalid control_type. Use 'start_call' or 'stop_call'")
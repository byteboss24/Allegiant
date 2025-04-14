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
    process_twilio_messages
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

async def send_initial_greeting(openai_ws: websockets.WebSocketClientProtocol) -> None:
    print(call_state.current_invoice)

    welcome_message = {
        "type": "response.create",
        "response": {
            "modalities": ["text", "audio"],
            "temperature": 0.8,
            "instructions": (
                "Say: 'Hello, my name is David calling from Allegiant Finance Services Ltd, "
                "an FCA-regulated claims management company. Am I speaking with {first_name} {last_name}?' "
                "Use a warm, professional tone. Keep it brief and welcoming."
            ).format(first_name=call_state.current_invoice['first_name'], last_name=call_state.current_invoice['last_name']), 
            "voice": settings.voice_type
        }
    }
    await openai_ws.send(json.dumps(welcome_message))

async def monitor_speech(websocket: WebSocket, openai_ws: websockets.WebSocketClientProtocol) -> None:
    try:
        await asyncio.sleep(7.0)
        if not call_state.is_speaking:
            await openai_ws.send(json.dumps({
                "type": "response.create",
                "response": {
                    "modalities": ["text", "audio"],
                    "temperature": 0.8,
                    "instructions": "To keep the customer focused on the call, say 'Hello' or 'Are you there?'",
                    "voice": settings.voice_type
                }
            }))
    except Exception as e:
        logger.error(f"Error in monitor_speech: {e}")



@router.post("/outbound")
async def outbound(request: OutboundRequest) -> str:
    print("Initiating outbound call...", request.invoice_number)
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
            '<Stream url="wss://{fastapi_domain}/twilio/media-stream"/>'
            '</Connect></Response>'
        ).format(fastapi_domain=settings.fastapi_domain)
        
        call = TWILIO_CLIENT.calls.create(
            from_="+441925596272",
            to=invoice.mobile_number,
            twiml=twiml
        )

        print(f"Now calling to {invoice.mobile_number}")

        isrecording = False
        recording = None
        invoice.status = "calling"
        await invoice_service.update_invoice(invoice.invoice_number, invoice)
        settings.call_count = settings.call_count + 1

        while True:
            data = TWILIO_CLIENT.calls(call.sid).fetch()

            if data.status == 'in-progress' and not isrecording:
                isrecording = True
                recording = TWILIO_CLIENT.calls(call.sid).recordings.create()
                print("recording1", recording)

            if data.status in ['failed', 'busy', 'no-answer', 'canceled']:
                print("Call ended with status:", data.status)
                await record_service.create_record(RecordCreate(
                    invoice_number=invoice.invoice_number,
                    duration=0,
                    transcript="",
                    audio_url="",
                    status=data.status
                ))
                invoice.status = data.status
                await invoice_service.update_invoice(invoice.invoice_number,invoice)
                break

            if data.status == 'completed':
                print("Call completed successfully", recording)
                await record_service.create_record(RecordCreate(
                    invoice_number=invoice.invoice_number,
                    duration=int(data.duration),
                    transcript="",
                    audio_url=f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Recordings/{recording.sid}" or "",
                    status=data.status
                ))
                invoice.status = data.status
                await invoice_service.update_invoice(invoice.invoice_number,invoice)
                break

            await asyncio.sleep(2)

        print("recording2", recording)
        settings.call_count = settings.call_count - 1

        logger.info(f"Call initiated - SID: {call}")
        return call.sid
        
    except Exception as e:
        logger.error(f"Error initiating call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/media-stream")
async def websocket_endpoint(websocket: WebSocket) -> None:
    openai_ws = None
    tasks = []
    
    try:
        await websocket.accept()
        logger.info("WebSocket connected")

        try:
            async with websockets.connect(
                'wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17',
                additional_headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "OpenAI-Beta": "realtime=v1"
                }
            ) as openai_ws:
                logger.info("OpenAI WebSocket connected")
                print("Current invoice:", call_state.current_invoice)

                if not call_state.current_invoice:
                    call_state.current_invoice = {
                        "id": 1,
                        "customer_id": "508942PDL",
                        "salutation": "Mr",
                        "file_number": "X644453",
                        "mobile_number": "1 904 572 4405",
                        "first_name": "John",
                        "last_name": "Doe",
                        "invoice_amount": "£ 2,153.59",
                        "outstanding_amount": "£ 1,000.00",
                        "fsp_name": "Moneybarn",
                        "invoice_number": "INV-QB-72004",
                        "email": "richardlloydmarshall@outlook.com",
                        "mailing_postcode": "L402QQ"
                    }

                await initialize_session(openai_ws, call_state.current_invoice)

                print("Openai socket initialized")
                
                # Set a timeout for receiving the initial message
                try:
                    stream_sid = await handle_twilio_connection(websocket)
                    print(f"Incoming stream has started {stream_sid}")
                    
                    # Wait for both tasks to complete
                    await asyncio.gather(
                        process_twilio_messages(websocket, openai_ws),
                        process_openai_messages(websocket, openai_ws, stream_sid)
                    )
                except asyncio.TimeoutError:
                    logger.warning("Timeout waiting for initial message")
                    raise WebSocketDisconnect("Timeout waiting for initial message")
        except websockets.exceptions.WebSocketException as e:
            logger.error(f"OpenAI WebSocket error: {e}")
            # Send error message to client
            try:
                await websocket.send_json({"event": "error", "message": "OpenAI connection failed"})
            except Exception:
                pass
            raise WebSocketDisconnect(f"OpenAI WebSocket error: {e}")
            
    except (WebSocketDisconnect, ValueError) as e:
        logger.warning(f"WebSocket disconnected: {e}")
    except Exception as e:
        logger.error(f"Error in websocket_endpoint: {e}", exc_info=True)
    finally:
        # Cancel any running tasks
        for task in tasks:
            if not task.done():
                task.cancel()
        
        # Wait for tasks to be cancelled
        for task in tasks:
            try:
                if not task.done():
                    await asyncio.wait_for(task, timeout=2.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                pass
            except Exception as e:
                logger.error(f"Error cancelling task: {e}")
        
        # Disconnect the WebSocket
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
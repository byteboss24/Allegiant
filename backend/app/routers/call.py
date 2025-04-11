from fastapi import APIRouter, WebSocket, HTTPException
from fastapi.websockets import WebSocketDisconnect
from app.core.config import settings
from twilio.rest import Client
from app.core.logger import logger
from app.services.invoice import InvoiceService
from openai import OpenAI
from pydantic import BaseModel
import base64
import json
import websockets
import asyncio
from app.core.prompt_templates.prompt import main_prompt
from typing import Optional, Dict, List
import wave

# Constants
OPENAI_API_KEY = settings.openai_api_key
TWILIO_CLIENT = Client(settings.twilio_account_sid, settings.twilio_auth_token)
OPENAI_CLIENT = OpenAI(api_key=OPENAI_API_KEY)
VOICE = 'ballad'
WEBSOCKET_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17'
LOG_EVENT_TYPES = frozenset([
    'error', 'response.content.done', 'rate_limits.updated',
    'input_audio_buffer.committed', 'input_audio_buffer.speech_stopped',
    'input_audio_buffer.speech_started', 'session.created', 'response.text.done'
])

router = APIRouter(prefix="/twilio", tags=["call"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_text(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def send_bytes(self, data: bytes, websocket: WebSocket):
        await websocket.send_bytes(data)

class CallState:
    def __init__(self):
        self.is_speaking = False
        self.current_invoice: Optional[Dict] = None

call_state = CallState()
manager = ConnectionManager()

class OutboundRequest(BaseModel):
    invoice_number: str

async def handle_media_event(data: Dict, openai_ws: websockets.WebSocketClientProtocol) -> None:
    # with wave.open("twilio_recording.wav", "wb") as wav_file:
    #     wav_file.writeframes(data['media']['payload'])
    audio_append = {
        "type": "input_audio_buffer.append",
        "audio": data['media']['payload']
    }
    await openai_ws.send(json.dumps(audio_append))

async def handle_audio_delta(response: Dict, websocket: WebSocket, stream_sid: str) -> None:
    try:
        audio_payload = base64.b64encode(base64.b64decode(response['delta'])).decode('utf-8')
        await websocket.send_json({
            "event": "media",
            "streamSid": stream_sid,
            "media": {"payload": audio_payload}
        })
    except Exception as e:
        logger.error(f"Error processing audio data: {e}")
        raise

async def initialize_session(openai_ws: websockets.WebSocketClientProtocol, invoice: Dict) -> None:
    system_message = main_prompt.format(**invoice, percentage="10%")
    session_config = {
        "type": "session.update",
        "session": {
            "turn_detection": {"type": "server_vad"},
            "input_audio_format": "g711_ulaw",
            "output_audio_format": "g711_ulaw",
            "voice": VOICE,
            "instructions": system_message,
            "modalities": ["text", "audio"],
            "temperature": 0.8,
        }
    }
    await openai_ws.send(json.dumps(session_config))
    await send_initial_greeting(openai_ws)

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
            "voice": VOICE
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
                    "voice": VOICE
                }
            }))
    except Exception as e:
        logger.error(f"Error in monitor_speech: {e}")

async def process_openai_messages(websocket: WebSocket, openai_ws: websockets.WebSocketClientProtocol, stream_sid: str) -> None:
    try:
        async for message in openai_ws:
            response = json.loads(message)
            
            # if response['type'] == 'input_audio_buffer.speech_started':
            #     print("Human start saying")
            #     call_state.is_speaking = True
            #     if call_state.is_speaking:
            #         await openai_ws.send(json.dumps({"type": "response.cancel"}))
            #         call_state.is_speaking = False
            if response['type'] in LOG_EVENT_TYPES:
                print(f"Received event: {response['type']}", response)
            if response['type'] == 'session.updated':
                print("Session updated successfully:", response)
            elif response['type'] == 'response.done':
                call_state.is_speaking = False
                try:
                    transcript = response.get('response', {}).get('output', [{}])[0].get('content', [{}])[0].get('transcript', "No transcript available")
                    print(f"AI Transcript: {transcript}")
                except Exception as e:
                    logger.error(f"Error getting transcript: {e}")
                    transcript = "No transcript available"
                # # Create task but don't await it directly to avoid blocking
                # monitor_task = asyncio.create_task(monitor_speech(websocket, openai_ws))
                # Optional: Add error handling for the task
                # monitor_task.add_done_callback(
                #     lambda t: logger.error(f"Monitor speech task error: {t.exception()}") if t.exception() else None
                # )
            
            elif response['type'] == 'response.audio.delta' and response.get('delta'):
                await handle_audio_delta(response, websocket, stream_sid)
    except websockets.exceptions.ConnectionClosed as e:
        logger.warning(f"OpenAI WebSocket closed: {e}")
    except asyncio.CancelledError:
        logger.info("OpenAI message processing cancelled")
    except Exception as e:
        logger.error(f"Error in process_openai_messages: {e}", exc_info=True)
        raise

@router.post("/outbound")
async def outbound(request: OutboundRequest) -> str:
    print("Initiating outbound call...", request.invoice_number)
    try:
        invoice = await InvoiceService.get_invoice(request.invoice_number)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        if not invoice.mobile_number:
            raise HTTPException(status_code=400, detail="No mobile number provided")

        call_state.current_invoice = invoice.model_dump()
        
        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Response><Connect>'
            '<Stream url="wss://ce8e-194-37-82-18.ngrok-free.app/twilio/media-stream"/>'
            '</Connect></Response>'
        )
        
        call = TWILIO_CLIENT.calls.create(
            from_="+441925596272",
            to=invoice.mobile_number,
            twiml=twiml
        )
        
        logger.info(f"Call initiated - SID: {call.sid}")
        return request.invoice_number
        
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
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "OpenAI-Beta": "realtime=v1"
                }
            ) as openai_ws:
                logger.info("OpenAI WebSocket connected")

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

async def handle_twilio_connection(websocket: WebSocket) -> str:
    """Wait for initial Twilio connection and return stream_sid."""
    print("Waiting for initial Twilio connection...")
    try:
       async for message in websocket.iter_text():
            data = json.loads(message)
            if data['event'] == 'start':
                stream_sid = data['start']['streamSid']
                return stream_sid
    except WebSocketDisconnect:
        print("Client disconnected during initial connection.")
        return None

async def process_twilio_messages(websocket: WebSocket, openai_ws: websockets.WebSocketClientProtocol) -> None:
    """Process incoming messages from Twilio."""
    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            if data['event'] == 'media':
                # print(f"Received media event: {data['media']}")
                await handle_media_event(data, openai_ws)
    except WebSocketDisconnect:
        print("Client disconnected.")

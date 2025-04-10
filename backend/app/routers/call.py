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
from contextlib import asynccontextmanager
import threading

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
        self._active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            if websocket in self._active_connections:
                self._active_connections.remove(websocket)

    async def send_message(self, message: Dict, websocket: WebSocket) -> None:
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            await self.disconnect(websocket)

class CallState:
    def __init__(self):
        self.is_speaking = False
        self.current_invoice: Optional[Dict] = None

call_state = CallState()
connection_manager = ConnectionManager()

class OutboundRequest(BaseModel):
    invoice_number: str

@asynccontextmanager
async def openai_websocket_connection():
    try:
        async with websockets.connect(
            WEBSOCKET_URL,
            additional_headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "OpenAI-Beta": "realtime=v1"
            }
        ) as ws:
            try:
                yield ws
            finally:
                # Ensure proper closing of the WebSocket
                try:
                    await ws.close()
                except websockets.exceptions.WebSocketException:
                    # WebSocket is already closed
                    pass
    except websockets.exceptions.WebSocketException as e:
        logger.error(f"OpenAI WebSocket connection error: {e}")
        raise

async def handle_media_event(data: Dict, openai_ws: websockets.WebSocketClientProtocol) -> None:
    audio_append = {
        "type": "input_audio_buffer.append",
        "audio": data['media']['payload']
    }
    await openai_ws.send(json.dumps(audio_append))

async def handle_audio_delta(response: Dict, websocket: WebSocket, stream_sid: str) -> None:
    try:
        audio_payload = base64.b64encode(base64.b64decode(response['delta'])).decode('utf-8')
        await connection_manager.send_message({
            "event": "media",
            "streamSid": stream_sid,
            "media": {"payload": audio_payload}
        }, websocket)
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
    welcome_message = {
        "type": "response.create",
        "response": {
            "modalities": ["text", "audio"],
            "temperature": 0.8,
            "instructions": (
                "Say: 'Hello, my name is David calling from Allegiant Finance Services Ltd, "
                "an FCA-regulated claims management company. Am I speaking with {call_state.current_invoice.first_name} {call_state.current_invoice.last_name}?' "
                "Use a warm, professional tone. Keep it brief and welcoming."
            ),
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
            
            if response['type'] in LOG_EVENT_TYPES:
                logger.debug(f"OpenAI event: {response['type']}", extra=response)
            
            elif response['type'] == 'input_audio_buffer.speech_started':
                call_state.is_speaking = True
                if call_state.is_speaking:
                    await openai_ws.send(json.dumps({"type": "response.cancel"}))
                    call_state.is_speaking = False
            
            elif response['type'] == 'response.done':
                call_state.is_speaking = False
                logger.info(f"AI Response: {response['response']}")
                # Create task but don't await it directly to avoid blocking
                monitor_task = asyncio.create_task(monitor_speech(websocket, openai_ws))
                # Optional: Add error handling for the task
                monitor_task.add_done_callback(
                    lambda t: logger.error(f"Monitor speech task error: {t.exception()}") if t.exception() else None
                )
            
            elif response['type'] == 'response.audio.delta' and response.get('delta'):
                call_state.is_speaking = True
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

        call_state.current_invoice = invoice
        
        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Response><Connect>'
            '<Stream url="wss://319a-194-37-82-18.ngrok-free.app/twilio/media-stream"/>'
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
        await connection_manager.connect(websocket)
        logger.info("WebSocket connected")

        try:
            async with openai_websocket_connection() as openai_ws:
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
                    message = await asyncio.wait_for(websocket.receive_text(), timeout=10.0)
                    data = json.loads(message)
                    if data['event'] != 'start':
                        raise ValueError("Expected 'start' event")
                        
                    stream_sid = data['start']['streamSid']
                    logger.info(f"Stream started: {stream_sid}")
                    
                    # Create tasks and store them for proper cleanup
                    twilio_task = asyncio.create_task(process_twilio_messages(websocket, openai_ws))
                    openai_task = asyncio.create_task(process_openai_messages(websocket, openai_ws, stream_sid))
                    tasks = [twilio_task, openai_task]
                    
                    # Wait for both tasks to complete
                    await asyncio.gather(*tasks)
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
        await connection_manager.disconnect(websocket)

async def process_twilio_messages(websocket: WebSocket, openai_ws: websockets.WebSocketClientProtocol) -> None:
    try:
        while True:
            try:
                # Add timeout to prevent hanging indefinitely
                message = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                data = json.loads(message)
                if data['event'] == 'media':
                    await handle_media_event(data, openai_ws)
            except asyncio.TimeoutError:
                # Send a ping to keep the connection alive
                try:
                    await websocket.send_json({"event": "ping"})
                except Exception as e:
                    logger.error(f"Error sending ping: {e}")
                    raise WebSocketDisconnect("Failed to send ping")
    except WebSocketDisconnect:
        logger.info("Twilio WebSocket disconnected")
    except asyncio.CancelledError:
        logger.info("Twilio message processing cancelled")
    except Exception as e:
        logger.error(f"Error processing Twilio messages: {e}", exc_info=True)
        raise

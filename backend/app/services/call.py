from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect
from app.core.config import settings
from app.core.logger import logger
from app.core.prompt_templates.prompt import main_prompt
import json
import websockets
import asyncio
import base64
from typing import Optional, Dict
from app.utils.twilio import TWILIO_CLIENT

LOG_EVENT_TYPES = frozenset([
    'error', 'response.content.done', 'rate_limits.updated',
    'input_audio_buffer.committed', 'input_audio_buffer.speech_stopped',
    'input_audio_buffer.speech_started', 'session.created', 'response.text.done'
])

class ConnectionManager:
    """Manages active WebSocket connections."""
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        try:
            self.active_connections.remove(websocket)
        except ValueError:
            logger.warning("Connection already removed")
        except Exception as e:
            logger.error(f"Error disconnecting: {e}")

    async def send_text(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def send_bytes(self, data: bytes, websocket: WebSocket):
        await websocket.send_bytes(data)

class CallState:
    """Tracks the current call state and invoices."""
    def __init__(self):
        self.is_speaking = False
        self.invoices: Dict[str, Dict] = {}

call_state = CallState()
manager = ConnectionManager()

async def handle_twilio_connection(websocket: WebSocket) -> Optional[dict]:
    """Wait for initial Twilio connection and return start event data."""
    logger.info("Waiting for initial Twilio connection...")
    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            if data['event'] == 'start':
                return data['start']
    except WebSocketDisconnect:
        logger.info("Client disconnected during initial connection.")
        return None

async def process_twilio_messages(websocket: WebSocket, openai_ws: websockets.WebSocketClientProtocol) -> None:
    """Process incoming messages from Twilio and forward audio to OpenAI."""
    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            if data['event'] == 'media':
                audio_append = {
                    "type": "input_audio_buffer.append",
                    "audio": data['media']['payload']
                }
                await openai_ws.send(json.dumps(audio_append))
    except WebSocketDisconnect:
        logger.info("Twilio client disconnected.")

async def initialize_session(openai_ws: websockets.WebSocketClientProtocol, invoice: Dict) -> None:
    """Initialize OpenAI session with invoice data."""

    system_message = main_prompt.format(**invoice, percentage="10%")
    session_config = {
        "type": "session.update",
        "session": {
            "turn_detection": {
                "type": "server_vad",
                "threshold": 0.7,
                "prefix_padding_ms": 300,
                "silence_duration_ms": 500,
            },
            "input_audio_format": "g711_ulaw",
            "output_audio_format": "g711_ulaw",
            "input_audio_transcription": {
                "model": "whisper-1"
            },
            "voice": settings.voice_type,
            "instructions": system_message,
            "modalities": ["text", "audio"],
            "temperature": 0.8,
            "tools": [
                {
                    "type": "function",
                    "name": "stop_call",
                    "description": "When you are finished with your conversation, end the call. End the call after the agent and customer say goodbye.",
                    "parameters": {}
                },
                {
                    "type": "function",
                    "name": "send_payment_link",
                    "description": "If person asks for a payment link, send to person that link.",
                    "parameters": {}
                },
                {
                    "type": "function",
                    "name": "say_hello",
                    "description": "If the person doesn't speak after 5 seconds of the ​​Agent speaking, say 'Hello' or 'Are you there?'",
                    "parameters": {}
                }
            ],
            "tool_choice": "auto"
        }
    }
    await openai_ws.send(json.dumps(session_config))
    await send_initial_greeting(openai_ws)

async def send_initial_greeting(openai_ws: websockets.WebSocketClientProtocol, callSid: str = None) -> None:
    """Send a welcome message to the user via OpenAI."""
    invoice = {}
    if callSid is not None:
        invoice = call_state.invoices.get(callSid, {})
    else:
        invoice = next(iter(call_state.invoices.values()), {})
    welcome_message = {
        "type": "response.create",
        "response": {
            "modalities": ["text", "audio"],
            "temperature": 0.8,
            "instructions": (
                "Say: 'Hello, my name is David calling from Allegiant Finance Services Ltd, "
                "an FCA-regulated claims management company. Am I speaking with {first_name} {last_name}?' "
                "Use a warm, professional tone. Keep it brief and welcoming."
            ).format(
                first_name=invoice.get('first_name', ''),
                last_name=invoice.get('last_name', '')
            ),
            "voice": settings.voice_type
        }
    }
    await openai_ws.send(json.dumps(welcome_message))

async def monitor_speech(openai_ws: websockets.WebSocketClientProtocol) -> None:
    """Monitor if the human is speaking; prompt if silent."""
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

async def process_openai_messages(websocket: WebSocket, openai_ws: websockets.WebSocketClientProtocol, data: dict) -> None:
    """Process messages from OpenAI and forward audio to Twilio."""
    try:
        async for message in openai_ws:
            response = json.loads(message)
            match response.get('type'):
                case 'conversation.item.input_audio_transcription.completed':
                    logger.info(f"Human : {response.get('transcript')}")
                    call_state.invoices[data['callSid']]['script'] = call_state.invoices[data['callSid']]['script'] + "Human: " + response.get('transcript') + "\n"
                case 'input_audio_buffer.speech_started':
                    logger.info("Human started speaking")
                    call_state.is_speaking = True
                    # Clear Twilio buffer
                    clear_twilio = {
                        "streamSid": data['streamSid'],
                        "event": "clear"
                    }
                    await websocket.send_json(clear_twilio)
                case 'input_audio_buffer.speech_stopped':
                    logger.info("Human stopped speaking")
                    call_state.is_speaking = False
                case 'response.output_item.done':
                    event = response['item']
                    if event.get('type') == 'function_call':
                        match event.get('name'):
                            case 'stop_call':
                                print("stop_call")
                                await openai_ws.send(json.dumps({
                                    "type": "function_call_output",
                                    "function_call": {
                                        "name": "stop_call",
                                        "call_id": event['call_id']
                                    },
                                    "output": "bye"
                                }))
                                await openai_ws.close()
                                TWILIO_CLIENT.calls(data['callSid']).update(status="completed")
                            case 'send_payment_link':
                                print("send_payment_link")
                                message = TWILIO_CLIENT.messages.create(
                                    from_='+447366532747',
                                    body=f"Hi {call_state.invoices[data['callSid']]['first_name']}.\nHere is your payment link: {call_state.invoices[data['callSid']]['payment_link']}\nPlease check your email for more details.\nThank you, Allegiant.",
                                    to=call_state.invoices[data['callSid']]['mobile_number']
                                )
                                await openai_ws.send(json.dumps({
                                    "type": "function_call_output",
                                    "function_call": {
                                        "name": "send_payment_link",
                                        "call_id": event['call_id']
                                    },
                                    "output": "I sent payment link, please check."
                                }))
                            case 'say_hello':
                                print("say_hello")
                                await openai_ws.send(json.dumps({
                                    "type": "function_call_output",
                                    "function_call": {
                                        "name": "say_hello",
                                        "call_id": event['call_id']
                                    },
                                    "output": "'Hello' or 'Are you there?'",
                                }))
                case 'response.done':
                    call_state.is_speaking = False
                    try:
                        transcript = response['response']['output']
                        match event.get('type'):
                            case 'message':
                                if transcript:
                                    logger.info(f"AI Agent: {transcript[0]['content'][0]['transcript']}, {data['callSid']}")
                                    call_state.invoices[data['callSid']]['script'] = call_state.invoices[data['callSid']]['script'] + "AI Agent: " + transcript[0]['content'][0]['transcript'] + "\n"
                            case 'function_call':
                                print("Function output:", transcript)
                    except Exception as e:
                        logger.error(f"Error getting transcript: {e}")
                case 'response.audio.delta' if response.get('delta'):
                    audio_payload = base64.b64encode(base64.b64decode(response['delta'])).decode('utf-8')
                    await websocket.send_json({
                        "event": "media",
                        "streamSid": data['streamSid'],
                        "media": {"payload": audio_payload}
                    })
    except websockets.exceptions.ConnectionClosed as e:
        logger.warning(f"OpenAI WebSocket closed: {e}")
    except asyncio.CancelledError:
        logger.info("OpenAI message processing cancelled")
    except Exception as e:
        logger.error(f"Error in process_openai_messages: {e}", exc_info=True)
        raise

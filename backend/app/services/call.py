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
from openai import OpenAI

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
    print("invoice", invoice)
    system_message = main_prompt.format(**invoice, percentage="10%")
    session_config = {
        "type": "session.update",
        "session": {
            "turn_detection": {
                "type": "server_vad",
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
            if response['type'] == 'conversation.item.input_audio_transcription.completed':
                logger.info(f"response: {response.get('transcript')}")
                call_state.invoices[data['callSid']]['script'] = call_state.invoices[data['callSid']]['script'] + "\nHuman:" + response.get('transcript')
            if response['type'] == 'input_audio_buffer.speech_started':
                logger.info("Human started speaking")
                call_state.is_speaking = True
            elif response['type'] == 'input_audio_buffer.speech_stopped':
                logger.info("Human stopped speaking")
                call_state.is_speaking = False
            elif response['type'] == 'response.done':
                call_state.is_speaking = False
                try:
                    transcript = response['response']['output']
                    if transcript:
                        logger.info(f"AI Transcript: {transcript[0]['content'][0]['transcript']}, {data['callSid']}")
                        call_state.invoices[data['callSid']]['script'] = call_state.invoices[data['callSid']]['script'] + "\nAI Agent:" + transcript[0]['content'][0]['transcript']
                        logger.info(f"Result: {call_state.invoices[data['callSid']]}")
                except Exception as e:
                    logger.error(f"Error getting transcript: {e}")
            elif response['type'] == 'response.audio.delta' and response.get('delta'):
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

from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect
from app.core.config import settings
from app.core.logger import logger
import json
import websockets
import asyncio
import base64
from typing import Optional, Dict

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
                audio_append = {
                    "type": "input_audio_buffer.append",
                    "audio": data['media']['payload']
                }
                await openai_ws.send(json.dumps(audio_append))
    except WebSocketDisconnect:
        print("Client disconnected.")

async def initialize_session(openai_ws: websockets.WebSocketClientProtocol, invoice: Dict) -> None:
    system_message = main_prompt.format(**invoice, percentage="10%")
    session_config = {
        "type": "session.update",
        "session": {
            "turn_detection": {"type": "server_vad"},
            "input_audio_format": "g711_ulaw",
            "output_audio_format": "g711_ulaw",
            "voice": settings.voice_type,
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
                "an FCA-regulated claims management company. Am I speaking with {first_name} {last_name}?' "
                "Use a warm, professional tone. Keep it brief and welcoming."
            ).format(
                first_name=call_state.current_invoice['first_name'],
                last_name=call_state.current_invoice['last_name']
            ), 
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

async def process_openai_messages(websocket: WebSocket, openai_ws: websockets.WebSocketClientProtocol, stream_sid: str) -> None:
    try:
        async for message in openai_ws:
            response = json.loads(message)
            
            if response['type'] in settings.log_event_types:
                print(f"Received event: {response['type']}", response)
            elif response['type'] == 'response.done':
                call_state.is_speaking = False
                try:
                    transcript = response.get('response', {}).get('output', [{}])[0].get('content', [{}])[0].get('transcript', "No transcript available")
                    print(f"AI Transcript: {transcript}")
                except Exception as e:
                    logger.error(f"Error getting transcript: {e}")
            
            elif response['type'] == 'response.audio.delta' and response.get('delta'):
                audio_payload = base64.b64encode(base64.b64decode(response['delta'])).decode('utf-8')
                await websocket.send_json({
                    "event": "media",
                    "streamSid": stream_sid,
                    "media": {"payload": audio_payload}
                })
    except websockets.exceptions.ConnectionClosed as e:
        logger.warning(f"OpenAI WebSocket closed: {e}")
    except asyncio.CancelledError:
        logger.info("OpenAI message processing cancelled")
    except Exception as e:
        logger.error(f"Error in process_openai_messages: {e}", exc_info=True)
        raise

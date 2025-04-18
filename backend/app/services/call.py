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
import time

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
    """Tracks the state for each call, including invoices and silence detection."""
    def __init__(self):
        self.invoices: Dict[str, Dict] = {}  # Invoice data per callSid
        self.is_speaking: Dict[str, bool] = {}  # Speaking state per callSid
        self.last_agent_response_time: Dict[str, float] = {}  # Last agent response time per callSid
        self.silence_detected: Dict[str, bool] = {}  # Silence detection flag per callSid

    def initialize_call(self, callSid: str):
        """Initialize state for a new call."""
        self.is_speaking[callSid] = False
        self.last_agent_response_time[callSid] = 0
        self.silence_detected[callSid] = False

    def cleanup_call(self, callSid: str):
        """Remove state for a completed call."""
        self.is_speaking.pop(callSid, None)
        self.last_agent_response_time.pop(callSid, None)
        self.silence_detected.pop(callSid, None)
        self.invoices.pop(callSid, None)

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
                    "description": "If person requests a payment link, send to person that link via sms.",
                    "parameters": {}
                },
                {
                    "type": "function",
                    "name": "say_hello",
                    "description": "If the person doesn't speak after 5 seconds of the Agent speaking, say 'Hello' or 'Are you there?'",
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

async def monitor_silence(openai_ws: websockets.WebSocketClientProtocol, callSid: str) -> None:
    """Monitor for 5 seconds of silence after agent finishes speaking and prompt if silent."""
    while callSid in call_state.invoices:  # Run until call ends
        try:
            if (
                call_state.last_agent_response_time.get(callSid, 0)
                and not call_state.is_speaking.get(callSid, False)
                and not call_state.silence_detected.get(callSid, False)
                and (time.time() - call_state.last_agent_response_time[callSid]) >= 5
            ):
                call_state.silence_detected[callSid] = True
                logger.info(f"Detected 5 seconds of silence for call {callSid}, triggering say_hello")
                await openai_ws.send(json.dumps({
                    "type": "response.create",
                    "response": {
                        "modalities": ["text", "audio"],
                        "temperature": 0.8,
                        "instructions": "Say 'Are you still there?' in a polite and professional tone.",
                        "voice": settings.voice_type
                    }
                }))
                # Reset the timer to prevent repeated prompts
                call_state.last_agent_response_time[callSid] = time.time()
            await asyncio.sleep(1)
        except Exception as e:
            logger.error(f"Error in monitor_silence for call {callSid}: {e}")
            break

async def process_openai_messages(websocket: WebSocket, openai_ws: websockets.WebSocketClientProtocol, data: dict) -> None:
    """Process messages from OpenAI and forward audio to Twilio."""
    callSid = data['callSid']
    try:
        async for message in openai_ws:
            response = json.loads(message)
            match response.get('type'):
                case 'conversation.item.input_audio_transcription.completed':
                    logger.info(f"Human (call {callSid}): {response.get('transcript')}")
                    call_state.invoices[callSid]['script'] = (
                        call_state.invoices[callSid]['script'] + "Human: " + response.get('transcript') + "\n"
                    )
                    call_state.is_speaking[callSid] = False
                    call_state.silence_detected[callSid] = False  # Reset silence detection on human speech
                    call_state.last_agent_response_time[callSid] = time.time()  # Reset timer on human input
                case 'input_audio_buffer.speech_started':
                    logger.info(f"Human started speaking (call {callSid})")
                    call_state.is_speaking[callSid] = True
                    call_state.silence_detected[callSid] = False
                    # Clear Twilio buffer
                    clear_twilio = {
                        "streamSid": data['streamSid'],
                        "event": "clear"
                    }
                    await websocket.send_json(clear_twilio)
                case 'input_audio_buffer.speech_stopped':
                    logger.info(f"Human stopped speaking (call {callSid})")
                    call_state.is_speaking[callSid] = False
                case 'response.output_item.done':
                    event = response['item']
                    if event.get('type') == 'function_call':
                        match event.get('name'):
                            case 'stop_call':
                                logger.info(f"Function call: stop_call (call {callSid})")
                                await openai_ws.send(json.dumps({
                                    "type": "conversation.item.create",
                                    "item": {
                                        "type": "function_call_output",
                                        "call_id": event['call_id'],
                                        "output": "bye"
                                    }
                                }))
                                await openai_ws.close()
                                TWILIO_CLIENT.calls(callSid).update(status="completed")
                                call_state.cleanup_call(callSid)  # Clean up call state
                            case 'send_payment_link':
                                logger.info(f"Function call: send_payment_link (call {callSid})")
                                message = TWILIO_CLIENT.messages.create(
                                    from_='+447366532747',
                                    body=f"Hi {call_state.invoices[callSid]['first_name']}.\nHere is your payment link: {call_state.invoices[callSid]['payment_link']}\nPlease check your email for more details.\nThank you, Allegiant.",
                                    to=call_state.invoices[callSid]['mobile_number']
                                )
                                logger.info(f"Sent payment link to {call_state.invoices[callSid]['mobile_number']} (call {callSid})")
                                await openai_ws.send(json.dumps({
                                    "type": "conversation.item.create",
                                    "item": {
                                        "type": "function_call_output",
                                        "call_id": event['call_id'],
                                        "output": "I sent payment link, please check."
                                    }
                                }))
                            case 'say_hello':
                                logger.info(f"Function call: say_hello (call {callSid})")
                                await openai_ws.send(json.dumps({
                                    "type": "conversation.item.create",
                                    "item": {
                                        "type": "function_call_output",
                                        "call_id": event['call_id'],
                                        "output": "Are you still there?"
                                    }
                                }))
                                
                case 'response.done':
                    call_state.is_speaking[callSid] = False
                    call_state.last_agent_response_time[callSid] = time.time()  # Update when agent finishes
                    call_state.silence_detected[callSid] = False  # Reset silence detection
                    try:
                        transcript = response['response']['output']
                        match event.get('type'):
                            case 'message':
                                if transcript:
                                    logger.info(f"AI Agent: {transcript[0]['content'][0]['transcript']}, {callSid}")
                                    call_state.invoices[callSid]['script'] = call_state.invoices[callSid]['script'] + "AI Agent: " + transcript[0]['content'][0]['transcript'] + "\n"
                            case 'function_call':
                                print("Function output:", transcript)
                                match transcript[0]['name']:
                                    case 'send_payment_link':
                                        welcome_message = {
                                            "type": "response.create",
                                            "response": {
                                                "modalities": ["text", "audio"],
                                                "temperature": 0.8,
                                                "instructions": (
                                                    "I sent payment link, please check that."
                                                ),
                                                "voice": settings.voice_type
                                            }
                                        }
                                        await openai_ws.send(json.dumps(welcome_message))
                                    case 'say_hello':
                                        await openai_ws.send(json.dumps({
                                            "type": "response.create",
                                            "response": {
                                                "modalities": ["text", "audio"],
                                                "temperature": 0.8,
                                                "instructions": "Say 'Are you still there?' in a polite and professional tone.",
                                                "voice": settings.voice_type
                                            }
                                        }))
                    except Exception as e:
                        logger.error(f"Error getting transcript for call {callSid}: {e}")
                case 'response.audio.delta' if response.get('delta'):
                    audio_payload = base64.b64encode(base64.b64decode(response['delta'])).decode('utf-8')
                    await websocket.send_json({
                        "event": "media",
                        "streamSid": data['streamSid'],
                        "media": {"payload": audio_payload}
                    })
    except websockets.exceptions.ConnectionClosed as e:
        logger.warning(f"OpenAI WebSocket closed for call {callSid}: {e}")
        call_state.cleanup_call(callSid)  # Clean up on disconnect
    except asyncio.CancelledError:
        logger.info(f"OpenAI message processing cancelled for call {callSid}")
        call_state.cleanup_call(callSid)  # Clean up on cancellation
    except Exception as e:
        logger.error(f"Error in process_openai_messages for call {callSid}: {e}", exc_info=True)
        call_state.cleanup_call(callSid)  # Clean up on error
        raise

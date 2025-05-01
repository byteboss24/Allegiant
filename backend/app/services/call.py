from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect
from app.core.config import settings
from app.core.logger import logger
from app.services.word_pronunciation import word_pronunciation_service
import websockets
import asyncio
from typing import Optional, Dict
from app.utils.twilio import TWILIO_CLIENT
import time
import json
import base64

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
        self.invoices: Dict[str, Dict] = {}
        self.is_speaking: Dict[str, bool] = {}
        self.last_agent_response_time: Dict[str, float] = {}
        self.silence_detected: Dict[str, bool] = {}
        self.audio_buffers: Dict[str, bytearray] = {}

    def initialize_call(self, callSid: str):
        """Initialize state for a new call."""
        self.is_speaking[callSid] = False
        self.last_agent_response_time[callSid] = time.time()
        self.silence_detected[callSid] = False
        self.audio_buffers[callSid] = bytearray()

    def cleanup_call(self, callSid: str):
        """Remove state for a completed call."""
        self.invoices.pop(callSid, None)
        self.is_speaking.pop(callSid, None)
        self.last_agent_response_time.pop(callSid, None)
        self.silence_detected.pop(callSid, None)
        self.audio_buffers.pop(callSid, None)

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
                try:
                    await openai_ws.send(json.dumps(audio_append))
                except (websockets.exceptions.ConnectionClosed, websockets.exceptions.ConnectionClosedOK) as e:
                    logger.warning(f"OpenAI WebSocket closed while sending audio: {e}")
                    break
    except WebSocketDisconnect:
        logger.info("Twilio client disconnected.")

async def initialize_session(openai_ws: websockets.WebSocketClientProtocol, invoice: Dict) -> None:
    """Initialize OpenAI session with invoice data."""
    print("initialize_session",invoice)
    word_pronunciations = await word_pronunciation_service.get_word_pronunciations(settings.agent_id)
    pronunciations = "\n".join(f"{wp.word}: {wp.pronunciation}" for wp in word_pronunciations)
    system_message = settings.system_prompt.format(**invoice, percentage="10%", pronunciations=pronunciations)
    tools = []
    tools.append({
        "type": "function",
        "name": "stop_call",
        "description": "Terminates the current conversation. Invoke this function when the user's query is fully resolved, user is done with the conversation, user confirms that call ends, no further information is needed, or the conversation should be ended based on context.",
        "parameters": {}
    })
    tools.append({
        "type": "function",
        "name": "send_payment_link",
        "description": "Invoke this function when the person requests a payment link. Human saying examples are 'Please send me a link.', 'Could you please send me a link.', 'I need a link.', 'Could you send me a payment link?', 'Please send me a sms message.' or etc",
        "parameters": {}
    })
    tools.append({
        "type": "function",
        "name": "say_hello",
        "description": "Invoke this function when the person doesn't speak after 5 seconds of the Agent speaking, say 'Hello' or 'Are you there?'",
        "parameters": {}
    })
    session_config = {
        "type": "session.update",
        "session": {
            "turn_detection": {
                "type": "server_vad",
                "threshold": 0.8,
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
            "tools": tools,
            "tool_choice": "auto"
        }
    }
    await openai_ws.send(json.dumps(session_config))

async def send_initial_greeting(openai_ws: websockets.WebSocketClientProtocol, callSid: str = None) -> None:
    """Send a welcome message to the user via OpenAI."""
    invoice = {}
    if callSid is not None:
        invoice = call_state.invoices.get(callSid, {})
        print("Initial Greeting", invoice)
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
    while callSid in call_state.invoices:
        try:
            if (
                call_state.last_agent_response_time.get(callSid, 0)
                and not call_state.is_speaking.get(callSid, False)
                and not call_state.silence_detected.get(callSid, False)
                and (time.time() - call_state.last_agent_response_time[callSid]) >= 5
            ):
                call_state.silence_detected[callSid] = True
                logger.info(f"Detected 5 seconds of silence for call {callSid}, triggering Say Hello")
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
                            case 'send_payment_link':
                                logger.info(f"Function call: send_payment_link (call {callSid})")
                                try:
                                    message = TWILIO_CLIENT.messages.create(
                                        from_='+447366532747',
                                        body=f"Hi {call_state.invoices[callSid]['first_name']}.\nHere is your payment link: {call_state.invoices[callSid]['payment_link']}\nPlease check your email for more details.\nThank you, Allegiant.",
                                        to=call_state.invoices[callSid]['mobile_number']
                                    )
                                    print("Message sent", message)
                                    if message is not None:
                                        call_state.invoices[callSid]['status'] = 'sms'
                                except Exception as e:
                                    logger.error(f"Error sending payment link to {call_state.invoices[callSid]['mobile_number']} (call {callSid}): {e}")
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
                                    "type": "response.create",
                                    "response": {
                                        "modalities": ["text", "audio"],
                                        "temperature": 0.7,
                                        "instructions": "Say 'Are you still there?' in a polite and professional tone.",
                                        "voice": settings.voice_type
                                    }
                                }))
                                await openai_ws.send(json.dumps({
                                    "type": "conversation.item.create",
                                    "item": {
                                        "type": "function_call_output",
                                        "call_id": event['call_id'],
                                        "output": "Are you still there?"
                                    }
                                }))
                case 'response.done':
                    try:
                        transcript = response['response']['output']
                        if transcript:
                            match transcript[0]['type']:
                                case 'message':
                                    logger.info(f"AI Agent: {transcript[0]['content'][0]['transcript']}, {callSid}")
                                    call_state.invoices[callSid]['script'] = call_state.invoices[callSid]['script'] + "AI Agent: " + transcript[0]['content'][0]['transcript'] + "\n"
                                case 'function_call':
                                    print("Function output:", transcript)
                                    match transcript[0]['name']:
                                        case 'send_payment_link':
                                            print("Sending payment link...")
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
                                            print("Saying hello...")
                                            await openai_ws.send(json.dumps({
                                                "type": "response.create",
                                                "response": {
                                                    "modalities": ["text", "audio"],
                                                    "temperature": 0.8,
                                                    "instructions": "Say 'Are you still there?' in a polite and professional tone.",
                                                    "voice": settings.voice_type
                                                }
                                            }))
                                        case 'stop_call':
                                            print("Stopping call...")
                                            await openai_ws.send(json.dumps({
                                                "type": "response.create",
                                                "response": {
                                                    "modalities": ["text", "audio"],
                                                    "temperature": 0.8,
                                                    "instructions": "Stop the call.",
                                                    "voice": settings.voice_type
                                                }
                                            }))
                                            await openai_ws.close()
                                            TWILIO_CLIENT.calls(callSid).update(status="completed")
                                            break
                    except Exception as e:
                        logger.error(f"Error getting transcript for call {callSid}: {e}")
                case 'response.audio.delta' if response.get('delta'):
                    # Decode and accumulate audio bytes for duration calculation
                    audio_bytes = base64.b64decode(response['delta'])
                    call_state.audio_buffers[callSid].extend(audio_bytes)
                    audio_payload = base64.b64encode(audio_bytes).decode('utf-8')
                    await websocket.send_json({
                        "event": "media",
                        "streamSid": data['streamSid'],
                        "media": {"payload": audio_payload}
                    })
                case 'response.audio.done':
                    print("Response audio done")
                    # Calculate duration of stacked audio
                    audio_buffer = call_state.audio_buffers.get(callSid, bytearray())
                    sample_rate = 8000
                    num_channels = 1
                    if audio_buffer:
                        duration_sec = len(audio_buffer) / (sample_rate * num_channels)
                        print(f"Total audio duration for call {callSid}: {duration_sec:.2f} seconds")
                    # Reset buffer for next segment
                    call_state.audio_buffers[callSid] = bytearray()
                    call_state.is_speaking[callSid] = False
                    call_state.last_agent_response_time[callSid] = time.time() + duration_sec
                    call_state.silence_detected[callSid] = False
    except websockets.exceptions.ConnectionClosed as e:
        logger.warning(f"OpenAI WebSocket closed for call {callSid}: {e}")
        call_state.cleanup_call(callSid)
    except asyncio.CancelledError:
        logger.info(f"OpenAI message processing cancelled for call {callSid}")
        call_state.cleanup_call(callSid)
    except Exception as e:
        logger.error(f"Error in process_openai_messages for call {callSid}: {e}", exc_info=True)
        call_state.cleanup_call(callSid)
        raise

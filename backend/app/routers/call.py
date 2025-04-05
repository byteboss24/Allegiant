from fastapi import APIRouter, Request, WebSocket
from fastapi.responses import HTMLResponse
from app.core.config import settings
from twilio.twiml.voice_response import VoiceResponse, Connect
from twilio.rest import Client
from app.core.logger import logger
from app.services.twilio import TwilioService
import base64
import argparse
from openai import OpenAI
from fastapi import WebSocket, WebSocketDisconnect
import json
import websockets
import asyncio
from pathlib import Path
import audioop
from app.core.prompt_templates.prompt import main_prompt

router = APIRouter(
    prefix="/twilio",
    tags=["call"]
)

OPENAI_API_KEY = settings.openai_api_key
TWILIO_ACCOUNT_SID = settings.twilio_account_sid
TWILIO_AUTH_TOKEN = settings.twilio_auth_token

twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
client = OpenAI(api_key=OPENAI_API_KEY)

speech_file_path = Path(__file__).parent / "speech.mp3"

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

manager = ConnectionManager()

@router.get("/test")
async def test():
    with client.audio.speech.with_streaming_response.create(
        model="gpt-4o-mini-tts",
        voice="coral",
        input="Today is a wonderful day to build something people love!",
        instructions="Speak in a cheerful and positive tone.",
    ) as response:
        response.stream_to_file(speech_file_path)

@router.websocket("/media-stream")
async def websocket_endpoint(websocket: WebSocket):
    print("Websocket connected")
    await manager.connect(websocket)

    async with websockets.connect(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        additional_headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "OpenAI-Beta": "realtime=v1"
        }
    ) as openai_ws:
        await initialize_session(openai_ws)
        stream_sid = None

        async def receive_from_twilio():
            """Receive audio data from Twilio and send it to the OpenAI Realtime API."""
            nonlocal stream_sid
            try:
                async for message in websocket.iter_text():
                    data = json.loads(message)
                    # print("==============data=============", data)
                    if data['event'] == 'media':
                        audio_append = {
                            "type": "input_audio_buffer.append",
                            "audio": data['media']['payload']
                        }
                        await openai_ws.send(json.dumps(audio_append))
                    elif data['event'] == 'start':
                        stream_sid = data['start']['streamSid']
                        print(f"Incoming stream has started {stream_sid}")
            except WebSocketDisconnect:
                print("Client disconnected.")

        async def send_to_twilio():
            """Receive events from the OpenAI Realtime API, send audio back to Twilio."""
            nonlocal stream_sid
            try:
                async for openai_message in openai_ws:
                    response = json.loads(openai_message)
                    # if response['type'] in LOG_EVENT_TYPES:
                    #     print(f"Received event: {response['type']}", response)
                    if response['type'] == 'input_audio_buffer.speech_started':
                        await websocket.send(json.dumps({
                            "event": "clear",
                            "streamSid": stream_sid
                        }))
                        
                    if response['type'] == 'response.audio.delta' and response.get('delta'):
                        try:
                            audio_payload = base64.b64encode(base64.b64decode(response['delta'])).decode('utf-8')
                            audio_delta = {
                                "event": "media",
                                "streamSid": stream_sid,
                                "media": {
                                    "payload": audio_payload
                                }
                            }
                            await websocket.send_json(audio_delta)
                        except Exception as e:
                            print(f"Error processing audio data: {e}")
            except Exception as e:
                print(f"Error in send_to_twilio: {e}")
        await asyncio.gather(receive_from_twilio(), send_to_twilio())

@router.get("/outbound")
async def outbound(phone_number: str):
    print("Outbound call")

    print("Making call to", phone_number)
    await make_call(phone_number)
    return phone_number

async def send_initial_conversation_item(openai_ws):
    """Send initial conversation so AI talks first."""
    welcome_message = (
        "Say: 'Hello, my name is David calling from Allegiant Finance Services Ltd, an FCA-regulated claims management company. Am I speaking with John Doe?' "
        "Use a warm, professional tone. Keep it brief and welcoming. "
        "Do not mention anything about being an assistant or AI model."
    )

    welcome_message = {
        "type": "response.create",
        "response": {
            "modalities": ["text", "audio"],
            "temperature": 0.8,
            "instructions": welcome_message
        }
    }
    await openai_ws.send(json.dumps(welcome_message))

VOICE = 'ballad'
LOG_EVENT_TYPES = [
    'error', 'response.content.done', 'rate_limits.updated', 'response.done',
    'input_audio_buffer.committed', 'input_audio_buffer.speech_stopped',
    'input_audio_buffer.speech_started', 'session.created'
]

async def initialize_session(openai_ws):
    """Control initial session with OpenAI."""
    first_name = "John"
    last_name = "Doe"
    lender_name = "Richard"
    invoice_amount = "£ 2030"
    amount = "£ 20"
    invoice_number = "INV-QB-72004"
    percentage = "10%"

    SYSTEM_MESSAGE = main_prompt.format(first_name=first_name, last_name=last_name, lender_name=lender_name, invoice_amount=invoice_amount, amount=amount, invoice_number=invoice_number, percentage=percentage)

    session_update = {
        "type": "session.update",
        "session": {
            "turn_detection": {"type": "server_vad"},
            "input_audio_format": "g711_ulaw",
            "output_audio_format": "g711_ulaw",
            "voice": VOICE,
            "instructions": SYSTEM_MESSAGE,
            "modalities": ["text", "audio"],
            "temperature": 0.8,
        }
    }

    # print('Sending session update:', json.dumps(session_update))
    await openai_ws.send(json.dumps(session_update))

    # Have the AI speak first
    await send_initial_conversation_item(openai_ws)

async def check_number_allowed(to):
    """Check if a number is allowed to be called."""
    try:
        # Uncomment these lines to test numbers. Only add numbers you have permission to call
        # OVERRIDE_NUMBERS = ['+447418316496'] 
        # if to in OVERRIDE_NUMBERS:             
          # return True

        incoming_numbers = twilio_client.incoming_phone_numbers.list(phone_number=to)
        if incoming_numbers:
            return True

        outgoing_caller_ids = twilio_client.outgoing_caller_ids.list(phone_number=to)
        if outgoing_caller_ids:
            return True

        return False
    except Exception as e:
        print(f"Error checking phone number: {e}")
        return False

async def make_call(phone_number_to_call: str):
    """Make an outbound call."""
    if not phone_number_to_call:
        raise ValueError("Please provide a phone number to call.")

    # is_allowed = await check_number_allowed(phone_number_to_call)
    # if not is_allowed:
    #     raise ValueError(f"The number {phone_number_to_call} is not regicognized as a valid outgoing number or caller ID.")

    # Ensure compliance with applicable laws and regulations
    # All of the rules of TCPA apply even if a call is made by AI.
    # Do your own diligence for compliance.

    outbound_twiml = (
        f'<?xml version="1.0" encoding="UTF-8"?>'
        f'<Response><Connect><Stream url="wss://80f8-194-37-82-18.ngrok-free.app/twilio/media-stream"/></Connect></Response>'
    )

    call = twilio_client.calls.create(
        from_="+441925596272",
        to=phone_number_to_call,
        twiml=outbound_twiml
    )

    await log_call_sid(call.sid)

async def log_call_sid(call_sid):
    """Log the call SID."""
    print(f"Call started with SID: {call_sid}")

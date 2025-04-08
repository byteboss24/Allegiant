from fastapi import APIRouter, Request, WebSocket, Depends
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
from app.core.prompt_templates.prompt import main_prompt
from app.services.invoice import InvoiceService
from pydantic import BaseModel

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

async def handle_media_event(data: dict, openai_ws: websockets.WebSocketClientProtocol):
    """Handle media event from Twilio."""
    audio_append = {
        "type": "input_audio_buffer.append",
        "audio": data['media']['payload']
    }
    await openai_ws.send(json.dumps(audio_append))

async def handle_start_event(data: dict) -> str:
    """Handle start event from Twilio and return stream_sid."""
    stream_sid = data['start']['streamSid']
    print(f"Incoming stream has started {stream_sid}")
    return stream_sid

async def handle_audio_delta(response: dict, websocket: WebSocket, stream_sid: str, openai_ws: websockets.WebSocketClientProtocol):
    """Process and send audio delta to Twilio."""
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
        openai_ws.close()

issaying = False

async def process_twilio_messages(websocket: WebSocket, openai_ws: websockets.WebSocketClientProtocol) -> None:
    """Process incoming messages from Twilio."""
    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            if data['event'] == 'media':
                await handle_media_event(data, openai_ws)
    except WebSocketDisconnect:
        print("Client disconnected.")

async def handle_twilio_connection(websocket: WebSocket) -> str:
    """Wait for initial Twilio connection and return stream_sid."""
    print("Waiting for initial Twilio connection...")
    try:
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            if data['event'] == 'start':
                return await handle_start_event(data)
    except WebSocketDisconnect:
        print("Client disconnected during initial connection.")
        return None

async def process_openai_messages(websocket: WebSocket, openai_ws: websockets.WebSocketClientProtocol, stream_sid: str) -> None:
    """Process messages from OpenAI and send responses to Twilio."""
    try:
        async for openai_message in openai_ws:
            response = json.loads(openai_message)
            if response['type'] in LOG_EVENT_TYPES:
                print(f"Received event1: {response['type']}", response)
            elif response['type'] == 'input_audio_buffer.speech_started':
                print("Speech detected")
                if issaying:
                    await openai_ws.send(json.dumps({
                        "type": "response.cancel"
                    }))
                    issaying = False
                # await websocket.send_json({
                #     "event": "clear",
                #     "streamSid": stream_sid
                # })
            elif response['type'] == 'response.done':
                issaying = False
                print("AI Response Transcript", response['response'])
                await send_hello_message(openai_ws)
            elif response['type'] == 'response.audio.delta' and response.get('delta'):
                issaying = True
                await handle_audio_delta(response, websocket, stream_sid, openai_ws)
    except Exception as e:
        print(f"Error in process_openai_messages: {e}")

class OutboundRequest(BaseModel):
    invoice_number: str

current_invoice = None

@router.post("/outbound", response_model=str)
async def outbound(request: OutboundRequest):
    """Make an outbound call with invoice details"""
    invoice = await InvoiceService.get_invoice(request.invoice_number)
    
    current_invoice = invoice
    await make_call(invoice)
    return request.invoice_number

@router.websocket("/media-stream")
async def websocket_endpoint(websocket: WebSocket):
    """Handle WebSocket connection for media streaming between Twilio and OpenAI."""
    print("Websocket connected")
    await manager.connect(websocket)

    async with websockets.connect(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        additional_headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "OpenAI-Beta": "realtime=v1"
        }
    ) as openai_ws:
        print("OpenAI WebSocket connected")
        await initialize_session(openai_ws)
        stream_sid = await handle_twilio_connection(websocket)
        print(f"Stream SID: {stream_sid}")
        await asyncio.gather(
            process_twilio_messages(websocket, openai_ws),
            process_openai_messages(websocket, openai_ws, stream_sid)
        )

async def send_hello_message(openai_ws):
    """Wait for speech_started event for 5 seconds, if not received send a hello message."""
    print("Waiting for speech_started event...")
    try:
        # Create a task to listen for speech_started event
        async def wait_for_speech():
            async for openai_message in openai_ws:
                response = json.loads(openai_message)
                if response['type'] == 'input_audio_buffer.speech_started':
                    print("Speech detected within 5 seconds")
                    return True
                else:
                    return False

        # Wait for speech_started event with timeout
        try:
            await asyncio.wait_for(wait_for_speech(), timeout=7.0)
            print("Speech detected within 5 seconds")
            return
        except asyncio.TimeoutError:
            print("No speech detected in 5 seconds, sending hello message")
            welcome_message = {
                "type": "response.create",
                "response": {
                    "modalities": ["text", "audio"],
                    "temperature": 0.8,
                    "instructions": "To keep the customer focused on the call, say 'Hello' or 'Are you there?'",
                    "voice": VOICE
                }
            }
            await openai_ws.send(json.dumps(welcome_message))
            return
    except Exception as e:
        print(f"Error in send_hello_message: {e}")

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
    'error', 'response.content.done', 'rate_limits.updated',
    'input_audio_buffer.committed', 'input_audio_buffer.speech_stopped',
    'input_audio_buffer.speech_started', 'session.created', 'response.text.done'
]

async def initialize_session(openai_ws):
    """Control initial session with OpenAI."""
    print("Current_invoice in initial Session", current_invoice)

    invoice = {
        "first_name": current_invoice.first_name,
        "last_name": current_invoice.last_name,
        "lender_name": "Richard",
        "invoice_amount": current_invoice.invoice_amount,
        "amount": current_invoice.outstanding_amount,
        "invoice_number": current_invoice.invoice_number,
        "percentage": "10%"
    }

    SYSTEM_MESSAGE = main_prompt.format(**invoice)

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

async def make_call(invoice):
    print("Invoice", invoice.mobile_number)
    """Make an outbound call."""
    if not invoice.mobile_number:
        raise ValueError("Please provide a phone number to call.")

    outbound_twiml = (
        f'<?xml version="1.0" encoding="UTF-8"?>'
        f'<Response><Connect><Stream url="wss://2efd-194-37-82-18.ngrok-free.app/twilio/media-stream"/></Connect></Response>'
    )

    call = twilio_client.calls.create(
        from_="+441925596272",
        to=invoice.mobile_number,
        twiml=outbound_twiml
    )

    await log_call_sid(call.sid)

async def log_call_sid(call_sid):
    """Log the call SID."""
    print(f"Call started with SID: {call_sid}")

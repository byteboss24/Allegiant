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
import os
import json
import websockets
import asyncio
from pathlib import Path

router = APIRouter(
    prefix="/twilio",
    tags=["call"]
)

# OpenAI API Credentials
OPENAI_API_KEY = settings.openai_api_key
client = OpenAI(api_key=OPENAI_API_KEY)

speech_file_path = Path(__file__).parent / "speech.mp3"

async def make_answer(transcript: str):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "assistant",
                    "content": [
                        {
                            "type": "text",
                            "text": "please answer as simple as you can."
                        }
                    ]
                },
                {"role": "user", "content": transcript}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error during answer generation: {e}")
        return None

async def synthesize_speech(text: str, websocket: WebSocket, stream_sid: str):
    try:
        with client.audio.speech.with_streaming_response.create(
            model="gpt-4o-mini-tts",
            voice="alloy",
            input=text,
            response_format="wav"
        ) as response:
            
            for chunk in response.iter_bytes():

                audio_delta = {
                    "event": "media",
                    "streamSid": stream_sid,
                    "media": {
                        "payload": chunk
                    }
                }
                
                await websocket.send_json(audio_delta)
    except Exception as e:
        print(f"Error during speech synthesis: {e}")
        return None

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
        'wss://api.openai.com/v1/realtime?intent=transcription',
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
                    # print("data==============================================", message)
                    data = json.loads(message)
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
                if openai_ws.open:
                    await openai_ws.close()

        async def send_to_twilio():
            """Receive events from the OpenAI Realtime API, send audio back to Twilio."""
            nonlocal stream_sid
            try:
                async for openai_message in openai_ws:
                    response = json.loads(openai_message)
                    # print("response==============================================", response)
                    if response['type'] in LOG_EVENT_TYPES:
                        print(f"Received event: {response['type']}", response)
                    if response['type'] == 'session.updated':
                        print("Session updated successfully:", response)
                    if response['type'] == 'conversation.item.input_audio_transcription.completed' and response.get('transcript'):
                        try:
                            print("response['transcript']", response['transcript'])
                            text = response['transcript']
                            answer = await make_answer(text)
                            print("answer", answer)
                            audio_bytes = await synthesize_speech(answer, websocket, stream_sid)
                            print("audio_bytes", dir(audio_bytes))
                            # audio_bytes = base64.b64encode(base64.b64decode(audio_bytes)).decode('utf-8')
                            # if audio_bytes:
                            #     audio_delta = {
                            #             "event": "media",
                            #             "streamSid": stream_sid,
                            #             "media": {
                            #                 "payload": audio_bytes
                            #             }
                            #         }
                            #     await websocket.send_json(audio_delta)

                        except Exception as e:
                            print(f"Error processing audio data: {e}")
            except Exception as e:
                print(f"Error in send_to_twilio: {e}")
        
        await asyncio.gather(receive_from_twilio(), send_to_twilio())

@router.get("/outbound")
async def outbound(phone_number: str):
    parser = argparse.ArgumentParser(description="Run the Twilio AI voice assistant server.")
    parser.add_argument('--call', required=True, help="The phone number to call, e.g., '--call=+18005551212'")
    args = parser.parse_args()

    phone_number = args.call
    print(
        'Our recommendation is to always disclose the use of AI for outbound or inbound calls.\n'
        'Reminder: All of the rules of TCPA apply even if a call is made by AI.\n'
        'Check with your counsel for legal and compliance advice.'
    )

    loop = asyncio.get_event_loop()
    loop.run_until_complete(make_call(phone_number))

async def send_initial_conversation_item(openai_ws):
    """Send initial conversation so AI talks first."""
    # initial_conversation_item = {
    #     "type": "conversation.item.create",
    #     "item": {
    #         "type": "message",
    #         "role": "user",
    #         "content": [
    #             {
    #                 "type": "input_text",
    #                 "text": (
    #                     "Greet the user with 'Hello there! I am an AI voice assistant powered by "
    #                     "Twilio and the OpenAI Realtime API. You can ask me for facts, jokes, or "
    #                     "anything you can imagine. How can I help you?'"
    #                 )
    #             }
    #         ]
    #     }
    # }
    # await openai_ws.send(json.dumps(initial_conversation_item))
    await openai_ws.send(json.dumps({"type": "response.create"}))

SYSTEM_MESSAGE = (
    "You are a helpful and bubbly AI assistant who loves to chat about "
    "anything the user is interested in and is prepared to offer them facts. "
    "You have a penchant for dad jokes, owl jokes, and rickrolling – subtly. "
    "Always stay positive, but work in a joke when appropriate."
)
VOICE = 'alloy'
LOG_EVENT_TYPES = [
    'error', 'response.content.done', 'rate_limits.updated', 'response.done',
    'input_audio_buffer.committed', 'input_audio_buffer.speech_stopped',
    'input_audio_buffer.speech_started', 'session.created'
]

async def initialize_session(openai_ws):
    """Control initial session with OpenAI."""
    session_update = {
        "type": "transcription_session.update",
        "session": {
            "input_audio_format": "g711_ulaw",
            "input_audio_transcription": {
                "model": "gpt-4o-mini-transcribe",
                "language": "en",
                "prompt": "Transcribe the incoming audio in real time."
            },
            "turn_detection": {"type": "server_vad", "threshold": 0.35, "prefix_padding_ms": 1000, "silence_duration_ms": 1000}
        }
    }

    # print('Sending session update:', json.dumps(session_update))
    await openai_ws.send(json.dumps(session_update))

    # Have the AI speak first
    # await send_initial_conversation_item(openai_ws)

async def check_number_allowed(to):
    """Check if a number is allowed to be called."""
    try:
        # Uncomment these lines to test numbers. Only add numbers you have permission to call
        # OVERRIDE_NUMBERS = ['+447418316496'] 
        # if to in OVERRIDE_NUMBERS:             
          # return True

        incoming_numbers = client.incoming_phone_numbers.list(phone_number=to)
        if incoming_numbers:
            return True

        outgoing_caller_ids = client.outgoing_caller_ids.list(phone_number=to)
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

    is_allowed = await check_number_allowed(phone_number_to_call)
    if not is_allowed:
        raise ValueError(f"The number {phone_number_to_call} is not recognized as a valid outgoing number or caller ID.")

    # Ensure compliance with applicable laws and regulations
    # All of the rules of TCPA apply even if a call is made by AI.
    # Do your own diligence for compliance.

    outbound_twiml = (
        f'<?xml version="1.0" encoding="UTF-8"?>'
        f'<Response><Connect><Stream url="wss://ab4c-194-37-82-18.ngrok-free.app/twilio/media-stream"/></Connect></Response>'
    )

    call = client.calls.create(
        from_="+441925596272",
        to="+447418316496",
        twiml=outbound_twiml
    )

    await log_call_sid(call.sid)

async def log_call_sid(call_sid):
    """Log the call SID."""
    print(f"Call started with SID: {call_sid}")
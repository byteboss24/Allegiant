from fastapi import APIRouter, Request, WebSocket
from fastapi.responses import HTMLResponse
from app.core.config import settings
from twilio.twiml.voice_response import VoiceResponse, Connect
from app.core.logger import logger
from app.services.twilio import TwilioService
import base64
from openai import OpenAI
from fastapi import WebSocket, WebSocketDisconnect
import os

router = APIRouter(
    prefix="/twilio",
    tags=["call"]
)

# OpenAI API Credentials
OPENAI_API_KEY = settings.openai_api_key
client = OpenAI(api_key=OPENAI_API_KEY)

async def transcribe_audio(audio_bytes: bytes):
    try:
        # Create a temporary file-like object for the bytes data
        with open("temp_audio.wav", "wb") as f:
            f.write(audio_bytes)

        # Verify the file exists and has content
        if not os.path.exists("temp_audio.wav") or os.path.getsize("temp_audio.wav") == 0:
            raise Exception("Failed to create audio file or file is empty")

        with open("temp_audio.wav", "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                language="en",
                file=audio_file,
                stream=True
                # response_format="text"
            )

            print("Transcript: ", transcript)

            for event in transcript:
                print("Event: ", event)
                print("Event.delta: ", event.delta)
                print("Event.text: ", event.text)

            if transcript.delta:
                print("Delta: ", transcript.delta)

            if transcript.text:
                return transcript.text

        try:
            os.remove("temp_audio.wav")
        except Exception as e:
            print(f"Warning: Could not remove temporary file: {e}")
            
        return None
    except Exception as e:
        print(f"Error during transcription: {e}")
        return None
    
async def make_answer(transcript: str):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": transcript}]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error during answer generation: {e}")
        return None

async def synthesize_speech(text: str):
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text,
            response_format="mp3"  # Changed to mp3 for better browser compatibility
        )
        audio_chunks = []
        for chunk in response.iter_bytes(chunk_size=4096):
            audio_chunks.append(chunk)
        return b"".join(audio_chunks)
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

@router.get("/inbound_call")
async def inbound_call(request: Request):
    query_params = request.query_params
    call_sid = query_params.get("CallSid", "Unknown")
    from_number = query_params.get("From", "Unknown")
    
    logger.info(f"Incoming call: CallSid={call_sid}, From={from_number}")

    response = VoiceResponse()
    connect = Connect()
    connect.stream(
        url=f"wss://{request.url.hostname}/twilio/stream?from_number={from_number}&call_sid={call_sid}",
        track="inbound_audio"
    )
    response.append(connect)
    
    return HTMLResponse(
        content=str(response),
        media_type="application/xml"
    )

@router.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if "audio_data" in data:
                print("Received audio data")
                audio_base64 = data["audio_data"]
                audio_bytes = base64.b64decode(audio_base64)
                transcript = await transcribe_audio(audio_bytes)

                print("Transcript-in main: ", transcript)
                if transcript:
                    print("Transcript-next main: ", transcript)
                    await manager.send_text({"type": "transcription", "text": transcript}, websocket)
                    answer = await make_answer(transcript)
                    if answer:
                        print("Answer: ", answer)
                        await manager.send_text({"type": "answer", "text": answer}, websocket)
                        audio = await synthesize_speech(answer)
                        if audio:
                            await manager.send_bytes(audio, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# async def websocket_endpoint(websocket: WebSocket, from_number: str = "Unknown", call_sid: str = None):
#     try:
#         twilio_service = TwilioService()
#         await twilio_service.handle_media_stream(websocket)
#     except Exception as e:
#         logger.error(f"Error in websocket endpoint: {e}")
#         if websocket.client_state != starlette.websockets.WebSocketState.DISCONNECTED:
#             await websocket.close()
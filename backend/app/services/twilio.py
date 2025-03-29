import asyncio
import json
import websockets
import base64
from fastapi import WebSocket, WebSocketDisconnect
from langchain_core.messages import AIMessage, HumanMessage
from langchain_community.chat_message_histories import ChatMessageHistory
from app.core.config import settings
from app.core.logger import logger
from openai import OpenAI
from app.services.callRecord import call_record_service

# OpenAI API Credentials
OPENAI_API_KEY = settings.openai_api_key
client = OpenAI(api_key=OPENAI_API_KEY)
OPENAI_REALTIME_WS_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01"

# Constants
VOICE = "alloy"  # You can change this to your preferred voice
SYSTEM_MESSAGE = "You are a helpful AI assistant."
LOG_EVENT_TYPES = ["session.updated", "response.audio.delta", "response.text"]

class TwilioService:
    def __init__(self):
        self.messages = ChatMessageHistory()
        self.conversation_active = False
        self.stream_sid = None
        self.call_sid = None

    def start_session(self):
        """Starts the conversation session."""
        self.conversation_active = True
        logger.info("Conversation started")

    def end_session(self):
        """Ends the conversation session."""
        self.conversation_active = False
        logger.info("Conversation ended")

    def handle_transcript(self, transcription):
        """Handles incoming transcription from Twilio."""
        logger.info(f"Transcription: {transcription}")
        self.messages.add_user_message(HumanMessage(transcription))
        
        # Process the transcription with AI
        asyncio.create_task(self.process_with_ai(transcription))

    async def process_with_ai(self, text):
        """Processes text with OpenAI and generates a response."""
        try:
            # Create a message for OpenAI
            message = {
                "type": "response.create",
                "response": {
                    "modalities": ["text", "audio"],
                    "temperature": 0.7,
                    "instructions": f"Respond to: {text}"
                }
            }
            
            if self.openai_ws and self.openai_ws.close_code is None:
                await self.openai_ws.send(json.dumps(message))
                
        except Exception as e:
            logger.error(f"Error processing with AI: {e}")

    async def handle_media_stream(self, websocket: WebSocket):
        """Handle WebSocket connections between Twilio and OpenAI."""
        logger.info("Client connected")
        await websocket.accept()
        
        async with websockets.connect(
            OPENAI_REALTIME_WS_URL,
            extra_headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "OpenAI-Beta": "realtime=v1"
            }
        ) as openai_ws:
            await self.send_session_update(openai_ws)
            
            async def receive_from_twilio():
                """Receive audio data from Twilio and send it to the OpenAI Realtime API."""
                try:
                    async for message in websocket.iter_text():
                        data = json.loads(message)
                        if data['event'] == 'media' and openai_ws.open:
                            audio_append = {
                                "type": "input_audio_buffer.append",
                                "audio": data['media']['payload']
                            }
                            await openai_ws.send(json.dumps(audio_append))
                        elif data['event'] == 'start':
                            self.stream_sid = data['start']['streamSid']
                            self.call_sid = data['start'].get('callSid')
                            if self.call_sid:
                                # Start recording the call
                                recording_info = call_record_service.record_call(self.call_sid)
                                logger.info(f"Started call recording: {recording_info}")
                            logger.info(f"Incoming stream has started {self.stream_sid}")
                        elif data.get('event') == 'transcription':
                            self.handle_transcript(data.get('transcription', {}).get('text', ''))
                        elif data.get('event') == 'stop' and self.call_sid:
                            # Stop recording when the call ends
                            call_record_service.stop_recording(self.call_sid)
                            logger.info(f"Stopped call recording for call {self.call_sid}")
                except WebSocketDisconnect:
                    logger.info("Client disconnected.")
                    if openai_ws.open:
                        await openai_ws.close()
                    # Stop recording if the call is disconnected
                    if self.call_sid:
                        call_record_service.stop_recording(self.call_sid)
                        logger.info(f"Stopped call recording after disconnect for call {self.call_sid}")

            async def send_to_twilio():
                """Receive events from the OpenAI Realtime API, send audio back to Twilio."""
                try:
                    async for openai_message in openai_ws:
                        response = json.loads(openai_message)
                        if response['type'] in LOG_EVENT_TYPES:
                            logger.info(f"Received event: {response['type']}", response)
                        if response['type'] == 'session.updated':
                            logger.info("Session updated successfully:", response)
                        if response['type'] == 'response.audio.delta' and response.get('delta'):
                            try:
                                audio_payload = base64.b64encode(base64.b64decode(response['delta'])).decode('utf-8')
                                audio_delta = {
                                    "event": "media",
                                    "streamSid": self.stream_sid,
                                    "media": {
                                        "payload": audio_payload
                                    }
                                }
                                await websocket.send_json(audio_delta)
                            except Exception as e:
                                logger.error(f"Error processing audio data: {e}")
                        elif response['type'] == 'response.text':
                            self.messages.add_ai_message(AIMessage(response['text']))
                            logger.info(f"AI Response: {response['text']}")
                except Exception as e:
                    logger.error(f"Error in send_to_twilio: {e}")

            await asyncio.gather(receive_from_twilio(), send_to_twilio())

    async def send_session_update(self, openai_ws):
        """Send session update to OpenAI WebSocket."""
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
        logger.info('Sending session update:', json.dumps(session_update))
        await openai_ws.send(json.dumps(session_update))
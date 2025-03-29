import asyncio
import base64
import json
from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect, WebSocketState
import logging

logger = logging.getLogger(__name__)

class TwilioAudioInterface:
    def __init__(self, ws: WebSocket):
        self.websocket = ws
        self.input_callback = None
        self.streamSid = None
        self.loop = asyncio.get_event_loop()

    def start(self, input_callback):
        self.input_callback = input_callback
    
    def stop(self):
        self.input_callback = None
        self.streamSid = None

    async def send_audio_stream(self, audio_stream: bytes):
        if not self.streamSid:
            logger.error("Stream SID not set")
            return
        
        try:
            if self.websocket.client_state == WebSocketState.CONNECTED:
                audio_payload = base64.b64encode(audio_stream).decode('utf-8')
                audio_message = {
                    'type': 'audio',
                    'streamSid': self.streamSid,
                    'payload': audio_payload
                }
                await self.websocket.send_text(json.dumps(audio_message))
                logger.info("Audio stream sent successfully")
        except (WebSocketDisconnect, RuntimeError):
            logger.error("Websocket connection closed")

    async def send_clear_audio_stream(self):
        if self.streamSid:
            clear_message = {
                'type': 'clear',
                'streamSid': self.streamSid
            }
            try:
                if self.websocket.client_state == WebSocketState.CONNECTED:
                    await self.websocket.send_text(json.dumps(clear_message))
                    logger.info("Clear audio stream sent successfully")
            except (WebSocketDisconnect, RuntimeError):
                logger.error("Websocket connection closed")
                pass

    async def receive_audio_stream(self, data):
        try:
            event_type = data.get('event')
            if event_type == 'start':
                self.streamSid = data.get('streamSid')
            elif event_type == "media":
                audio_data = base64.b64decode(data["media"]["payload"])
                if self.input_callback:
                    self.input_callback(audio_data)
            elif event_type == "transcription":
                if self.input_callback:
                    self.input_callback(data["transcription"]["text"])
        except Exception as e:
            logger.error(f"Error handling Twilio message: {e}")
            raise
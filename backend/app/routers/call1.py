from fastapi import APIRouter, Request, WebSocket
from fastapi.responses import HTMLResponse
from twilio.twiml.voice_response import VoiceResponse, Connect
from app.core.logger import logger
from app.services.twilio import TwilioService
import starlette.websockets

router = APIRouter(
    prefix="/twilio",
    tags=["call"]
)

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
async def websocket_endpoint(websocket: WebSocket, from_number: str = "Unknown", call_sid: str = None):
    try:
        twilio_service = TwilioService()
        await twilio_service.handle_media_stream(websocket)
    except Exception as e:
        logger.error(f"Error in websocket endpoint: {e}")
        if websocket.client_state != starlette.websockets.WebSocketState.DISCONNECTED:
            await websocket.close()

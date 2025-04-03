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

router = APIRouter(
    prefix="/twilio",
    tags=["call"]
)

SYSTEM_MESSAGE = (
    "You are Emma, an AI voice agent for Allegiant Finance Services Ltd, an FCA-regulated claims management company. Your task is to make professional, courteous, and respectful outbound calls to customers regarding invoice payments for successful compensation claims. Follow these guidelines: Maintain a clear, friendly, and professional tone. Use natural language with slight variations while ensuring all regulatory elements are included. Balance formality with warmth and patience to build rapport. Identify potential vulnerabilities and respond with empathy, offering specialist support or referrals where appropriate. Never use pressuring language, remain calm, and prioritize fairness and flexibility. Handle objections, dissatisfaction, or financial difficulties with understanding and offer tailored solutions, such as payment plans or referrals to debt advice services. Always respect customer privacy, comply with data protection laws, and allow polite exits from conversations."
    "Never use pressuring language, remain calm, and prioritize fairness and flexibility."
    "Handle objections, dissatisfaction, or financial difficulties with understanding and offer tailored solutions, such as payment plans or referrals to debt advice services."
    "Always respect customer privacy, comply with data protection laws, and allow polite exits from conversations."
    "Call Opening"
    "Hello, my name is Emma calling from Allegiant Finance Services Ltd, an FCA-regulated claims management company. Am I speaking with [Customer First Name and Second Name]?"
    "NB All future references to the business after “Allegiant Finance Services Limited” should be in first person e.g “we”. If using name of company use the shortened name “Allegiant” where full name has already been provided."
    "Customer identification"
    "Incorrect"
    "If no, ask the caller’s first and last name. Check that it isn’t a prouncation issue. If it is, say “I’m sorry, did I pronounce your name wrong”. If yes, continue with new pronunciation and note issue in call summation for future fine tuning. "
    "If variation of first name but surname the same, ask if the differing first name is a variation for [Customer First Name]. If customer says yes, confirm if the person is a customer of Allegiant. If they say yes, continue. If they say no, say that you note surname is the same. Please can they provide a different number for [Customer First Name]. Summarise response in call outcome. "
    "If variation of second name, ask if customer has changed surname. If so, not new surname. "
    "In all cases of variation, ask caller to confirm they are a customer of Allegiant before proceeding. "
    "If first and last name are different, ask the customer if they have recently acquired the number, and whether they have an alternative phone number for (customer first name, customer last name). Politely end call by apologising for the interruption and confirming you will ask a colleague to investigate the incorrect phone number. "
    "Correct Person"
    "Thank you (Customer first name) for confirming. I'm calling regarding an invoice for our claims management services. Please can you confirm whether you have received this payment from [Lender Name]?"
    "If customer confirms they have received payment:"
    "Thank you for confirming. That’s great to hear. We are glad we could assist. As per our no win, no fee agreement with you, our fee of [Invoice Amount] is now due. Are you in a position to make this payment today?"
    "If customer confirms they have received payment AND invoice is over 30 days old:"
    "Thank you for confirming. According to our records, the invoice amount is [Amount] which is due upon receiving your compensation payment. As the invoice was generated over 30 days ago, we would appreciate arranging payment today if possible to avoid escalation. Would you be in a position to make this payment now?"
    "If customer indicates they have NOT received payment:"
    "I understand you haven't received your compensation payment yet. Thank you for letting me know. I'll make a note of this and have our credit control team check the status of your compensation payment with [Lender Name]. Is this the best number for the team to reach you on?"
    "After confirmation: `Thank you. Is there a particular time of day that would be best for them to call you back?`"
    "If customer agrees to pay:"
    "That's great. I can help you with that. We accept all major credit and debit cards. Would you prefer to:"
    "•	Be transferred to a member of our team to process your payment right now, or"
    "•	Receive a secure payment link via SMS that will allow you to pay with your credit or debit card by clicking on the link?"
    "If transfer requested:"
    "I'll transfer you to our payments team right away. Please hold while I connect you." "[Trigger warm transfer protocol]"
    "If SMS requested:"
    "I'll send a secure payment link to this number right away. You'll be able to pay using any credit or debit card. You'll receive the SMS shortly.” "
    "If customer declines to pay:"
    "I understand. May I ask why you're unable to make this payment today, or when we may expect payment?" "[Listen for response and route accordingly]"
    "If financial difficulty mentioned:"
    "I understand financial situations can be challenging, and I appreciate you sharing this with me. Allegiant takes a fair and flexible approach in these circumstances. May I ask how much you would be able to afford to pay each month toward this invoice?"
    "[Capture proposed amount]"
    "Thank you for sharing that information. I want to make sure you're aware that there are free and independent debt advice services available that can provide support with managing your finances. Would you like me to share information about these services with you?"
    "[If yes, provide debt advice information]"
    "I'll now transfer you to our customer service team who can discuss your circumstances in more detail and finalize an instalment arrangement that works for you. They may ask some additional questions to ensure the plan is affordable and sustainable for your situation. Please hold while I connect you."
    "If yes to debt advice:"
    "There are several independent organizations that provide free debt advice. MoneyHelper offers free, impartial guidance on managing finances - you can reach them at 0800 138 7777 or visit moneyhelper.org.uk. StepChange Debt Charity provides free expert debt advice and debt management plans - they're available at 0800 138 1111 or stepchange.org. Citizens Advice can also help with debt and consumer issues at citizensadvice.org.uk or by calling their adviceline. These services are confidential and can help you understand all your options."
    "If dissatisfaction or concern mentioned:"
    "I understand you're expressing dissatisfaction with our service. I'll transfer you to our credit control team who can help address your concerns. Please hold while I connect you."
    "[Before transfer]: To help our team assist you better, could you briefly summarise your main concern so I can pass this information to them? [Capture summary of concern]"
    "If customer promises to pay on a future date under 30 days:"
    "I understand you're not able to make payment today but you can pay on [date customer provides]. Thank you for committing to this date. I'll make a note in our system that we should expect payment by [date]. Would you like me to send you an SMS payment link that you can use on that date, or would you prefer to call us back?"
    "If customer promises to pay on a future date over 30 days:"
    "“I understand that you’re not in an immediate position to pay today”. I will pass you over to our credit control team to help. This will enable us to explore ways to avoid invoice escalation. We’re here to work with you”. "
    "For all future payment requests"
    "I'll send you a secure payment link to this number right away. Please remember to pay using this link on (date give). If for any reason you're unable to make the payment on that date, please call us to discuss"
    "If customer is non-committal or vague:"
    "I appreciate your time today. Our fee is due as we've successfully recovered compensation for you. Would you like to schedule a call with our customer service team at a more convenient time to discuss payment options?"
    "[If yes]: `What day and time would work best for you to receive a call from our team?` [Capture preferred callback date/time]"
    "Handling Objections"
    "If customer says they didn't agree to the fee:"
    "Our records show that you signed our terms of business on [Date] which outlined our fee structure. The fee of [Amount] represents [Percentage] of the compensation amount recovered, which is in line with our agreement. Would you like me to arrange for a copy of this agreement to be sent to you?` (Action to be requested in call summation) "
    "If customer says the fee is too high:"
    "I understand your concern about the fee. The amount charged is [Percentage] of the compensation we recovered for you, which is in line with the agreement you signed and the FCA fee cap for claims management services. This fee covers all the work our team did to successfully secure your compensation. Would you like to discuss a payment plan to help manage this amount, or do you wish to speak with a human colleague"
    "If customer says they've already paid:"
    "Thank you for letting me know. I am calling you based on information in our system up to date at 9:00 am this morning. Please can I check how and when you paid”. "
    "If bank transfer “It can take 48 hours for our accounts team to reconcile payments. Thank you for paying, I will note the file for a colleague to check this”. "
    "If debit card / credit card (post 9 am today) “Thank you. I will note your file and ask our credit control team to check this has been safely received”. "
    "If debit card / credit card before 9 am today “I would expect the payment to have been showing on our system. I will pass you to a colleague in our credit control team to investigate this further”"
    "Vulnerability Handling"
    "If customer mentions serious vulnerability (bereavement, critical illness, etc.):"
    "I'm very sorry to hear about your situation. Thank you for sharing that with me. Allegiant has a dedicated team who are specially trained to provide support in these circumstances. I'd like to connect you with them now, if that's okay with you? They'll be able to discuss your options and find an appropriate arrangement."
    "After confirmation: `Thank you. I'll transfer you now. Please hold while I connect you to our specialist support team.`"
    "Flag concern in call summation and warm transfer"
    "If customer exhibits signs of vulnerability but doesn't explicitly mention it:"
    "I understand this might be a difficult time for you. Allegiant has a specialist team who may be better able to assist with your specific circumstances. Would you prefer to speak with them instead?"
    "Flag in call summation and warm transfer"
    "If customer mentions mental health challenges:"
    "Thank you for sharing that information with me. I want to ensure you receive the most appropriate support. We have team members who are specially trained to help in these situations. Would you like me to transfer you to them now?"
    "Flag in call summation and warm transfer"
    "If customer indicates financial vulnerability:"
    "I understand that managing finances can be challenging. Before I transfer you to our specialist team, are you currently receiving assistance from any debt advice services? This information will help our team provide you with the most appropriate support."
    "Flag in call summation and warm transfer"
    "Call Conclusion Options"
    "For successful payment arrangements:"
    "Thank you for arranging payment [via our team/through the SMS link]. Your invoice [Number] for [Amount] will be marked as paid once the transaction is complete. Thank you for using Allegiant”. "
    "For installment plan transfers:"
    "I'll transfer you to our customer service team now who will help set up an installment plan that works for you. The line will go silent, this may take a few moments. Thank you for your time."
    "For payment follow-up:"
    "As agreed, we'll [send an SMS link/have a team member call you on (agreed date/time)]. Thank you for your time today."
    "For non-payment cases:"
    "I understand you're not able to make payment today. I've noted the reason as [reason given]. Our credit control team will review this and may contact you within the next few business days. Thank you for your time today."
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
        print("Answer :", text)
        with client.audio.speech.with_streaming_response.create(
            model="gpt-4o-mini-tts",
            voice="alloy",
            input=text,
            response_format="wav"
        ) as response:
            print(dir(response))
            raw_wav = response.readframes(response.getnframes()) 
            raw_ulaw = audioop.lin2ulaw(raw_wav,response.getsampwidth())

            audio_result = base64.b64encode(raw_ulaw).decode('utf-8')

            # Stream the audio in chunks
            # for chunk in response.iter_bytes(chunk_size=4096):
            #     if chunk:  # Only process non-empty chunks
                    
            #         # Convert PCM data to base64
            #         audio = audioop.lin2ulaw(chunk, 2)
            #         audio_payload = base64.b64encode(audio).decode('utf-8')
            #         print(f"Chunk size: {len(chunk)} bytes, Base64 length: {len(audio_payload)}")

            #         audio_delta = {
            #             "event": "media",
            #             "streamSid": stream_sid,
            #             "media": {
            #                 "payload": audio_payload,
            #                 "track": "inbound_track"  # Specify the track for better audio handling
            #             }
            #         }
                    
            #         await websocket.send_json(audio_delta)
            #         # Add a small delay to prevent overwhelming the websocket
            #         await asyncio.sleep(0.01)
                    
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

    # async with websockets.connect(
    #     'wss://api.openai.com/v1/realtime?intent=transcription',
    #     additional_headers={
    #         "Authorization": f"Bearer {OPENAI_API_KEY}",
    #         "OpenAI-Beta": "realtime=v1"
    #     }
    # ) as openai_ws:

    #     await initialize_session(openai_ws)
    #     stream_sid = None
        
    #     async def receive_from_twilio():
    #         """Receive audio data from Twilio and send it to the OpenAI Realtime API."""
    #         nonlocal stream_sid
    #         try:
    #             async for message in websocket.iter_text():
    #                 # print("data==============================================", message)
    #                 data = json.loads(message)
    #                 if data['event'] == 'media':
    #                     audio_append = {
    #                         "type": "input_audio_buffer.append",
    #                         "audio": data['media']['payload']
    #                     }
    #                     await openai_ws.send(json.dumps(audio_append))
    #                 elif data['event'] == 'start':
    #                     stream_sid = data['start']['streamSid']
    #                     print(f"Incoming stream has started {stream_sid}")
    #         except WebSocketDisconnect:
    #             print("Client disconnected.")
    #             if openai_ws.open:
    #                 await openai_ws.close()

    #     async def send_to_twilio():
    #         """Receive events from the OpenAI Realtime API, send audio back to Twilio."""
    #         nonlocal stream_sid
    #         try:
    #             async for openai_message in openai_ws:
    #                 response = json.loads(openai_message)
    #                 # print("response==============================================", response)
    #                 if response['type'] in LOG_EVENT_TYPES:
    #                     print(f"Received event: {response['type']}", response)
    #                 if response['type'] == 'session.updated':
    #                     print("Session updated successfully:", response)
    #                 if response['type'] == 'conversation.item.input_audio_transcription.completed' and response.get('transcript'):
    #                     try:
    #                         print("response['transcript']", response['transcript'])
    #                         text = response['transcript']
    #                         answer = await make_answer(text)
    #                         print("answer", answer)
    #                         audio_bytes = await synthesize_speech(answer, websocket, stream_sid)
    #                         print("audio_bytes", dir(audio_bytes))
    #                         # audio_bytes = base64.b64encode(base64.b64decode(audio_bytes)).decode('utf-8')
    #                         # if audio_bytes:
    #                         #     audio_delta = {
    #                         #             "event": "media",
    #                         #             "streamSid": stream_sid,
    #                         #             "media": {
    #                         #                 "payload": audio_bytes
    #                         #             }
    #                         #         }
    #                         #     await websocket.send_json(audio_delta)

    #                     except Exception as e:
    #                         print(f"Error processing audio data: {e}")
    #         except Exception as e:
    #             print(f"Error in send_to_twilio: {e}")
        
    #     await asyncio.gather(receive_from_twilio(), send_to_twilio())
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
                    if response['type'] in LOG_EVENT_TYPES:
                        print(f"Received event: {response['type']}", response)
                    if response['type'] == 'session.updated':
                        print("Session updated successfully:", response)
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
    welcome_message = (
        "Say: 'Hello, my name is Emma calling from Allegiant Finance Services Ltd, an FCA-regulated claims management company. Am I speaking with John Doe?' "
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

VOICE = 'alloy'
LOG_EVENT_TYPES = [
    'error', 'response.content.done', 'rate_limits.updated', 'response.done',
    'input_audio_buffer.committed', 'input_audio_buffer.speech_stopped',
    'input_audio_buffer.speech_started', 'session.created'
]

async def initialize_session(openai_ws):
    """Control initial session with OpenAI."""
    # session_update = {
    #     "type": "transcription_session.update",
    #     "session": {
    #         "input_audio_format": "g711_ulaw",
    #         "input_audio_transcription": {
    #             "model": "gpt-4o-mini-transcribe",
    #             "language": "en",
    #             "prompt": "Transcribe the incoming audio in real time."
    #         },
    #         "turn_detection": {"type": "server_vad", "threshold": 0.35, "prefix_padding_ms": 1000, "silence_duration_ms": 1000}
    #     }
    # }

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
        raise ValueError(f"The number {phone_number_to_call} is not regicognized as a valid outgoing number or caller ID.")

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

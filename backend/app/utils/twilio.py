from twilio.rest import Client
from app.core.config import settings

TWILIO_CLIENT = Client(settings.twilio_account_sid, settings.twilio_auth_token)

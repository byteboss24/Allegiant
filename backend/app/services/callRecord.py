from twilio.rest import Client
from app.core.config import settings
from app.core import state

class CallRecordService:
    def __init__(self):
        account_sid = settings.twilio_account_sid
        auth_token = settings.twilio_auth_token
        self.client = Client(account_sid, auth_token)

    def record_call(self, call_sid: str) -> str:
        recording = self.client.calls(call_sid).recordings.create(
            recording_status_callback_url='https://webhook.site/21742565-ba62-4ce6-ab62-83bab0924b1c',
            trim='do-not-trim',
        )
        return {'call_sid': call_sid, 'url': recording.uri}
    
    def stop_recording(self, call_sid: str) -> str:
        recording = self.client.calls(call_sid).recordings.get(sid=call_sid)
        if recording:
            recording.update(status='stopped')
        return True
    
call_record_service = CallRecordService()

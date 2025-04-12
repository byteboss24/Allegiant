from pydantic import BaseModel
from datetime import datetime

class CallBase(BaseModel):
    invoice_number: str
    duration: float
    transcript: str
    audio_url: str

class CallCreate(CallBase):
    pass

class CallUpdate(BaseModel):
    id: int
    created_at: datetime

class Call(CallBase):
    id: int
    created_at: datetime

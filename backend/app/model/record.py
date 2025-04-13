from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class RecordBase(BaseModel):
    invoice_number: str
    duration: int
    transcript: str
    audio_url: str
    status: str = "pending"

    class Config:
        from_attributes = True

class RecordCreate(RecordBase):
    pass

class Record(RecordBase):
    id: int
    created_at: datetime

class RecordResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Record] = None


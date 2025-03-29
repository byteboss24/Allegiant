from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

class RecordBase(BaseModel):
    name: str
    record_id: int
    script: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        from_attributes = True

class RecordCreate(RecordBase):
    pass

class RecordUpdate(BaseModel):
    phone_number: Optional[str] = None
    is_completed: Optional[bool] = None
    call_recording_url: Optional[str] = None

class Record(RecordBase):
    record_id: Optional[str] = None

class RecordResponseData(BaseModel):
    record_id: int
    name: str
    phone: str
    claim_reference: str
    invoice_details: str
    outstanding_amount: float
    created_at: datetime
    call_status: str
    campaign_name: str
    script: Optional[str] = None
    phone_strategy: Optional[str] = None

class RecordResponse(BaseModel):
    success: bool
    message: str
    data: Optional[RecordResponseData] = None

class CSVUploadResponse(BaseModel):
    success: bool
    message: str
    total_records: int
    successful_records: int
    failed_records: int
    errors: Optional[List[str]] = None

class CSVUploadRequest(BaseModel):
    campaign_name: str
    script: str
    phone_strategy: str

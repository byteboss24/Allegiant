from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

class InvoiceBase(BaseModel):
    name: str
    phone: str
    claim_reference: str
    invoice_details: str
    outstanding_amount: float
    created_at: datetime

    class Config:
        from_attributes = True

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(BaseModel):
    phone_number: Optional[str] = None
    call_recording_url: Optional[str] = None

class Invoice(InvoiceBase):
    call_status: Optional[str] = None
    campaign_name: Optional[str] = None
    script: Optional[str] = None
    phone_strategy: Optional[str] = None
    invoice_id: Optional[str] = None

class InvoiceResponseData(BaseModel):
    invoice_id: int
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

class InvoiceResponse(BaseModel):
    success: bool
    message: str
    data: Optional[InvoiceResponseData] = None

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

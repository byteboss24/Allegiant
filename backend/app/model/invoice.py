from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class InvoiceBase(BaseModel):
    customer_id: str
    first_name: str
    last_name: str
    salutation: str
    file_number: Optional[str] = None
    mobile_number: Optional[str] = None
    phone_number: Optional[str] = None
    claim_reference: str
    invoice_number: str
    invoice_date: datetime
    invoice_amount: str
    fsp_name: str
    outstanding_amount: str
    email: str
    mailing_postcode: str
    payment_link: Optional[str] = None

    class Config:
        from_attributes = True

class InvoiceCreate(InvoiceBase):
    created_at: datetime
    campaign_name: Optional[str] = None
    pass

class InvoiceUpdate(BaseModel):
    phone_number: Optional[str] = None
    call_recording_url: Optional[str] = None

class Invoice(InvoiceBase):
    status: Optional[str] = None
    campaign_name: Optional[str] = None
    script: Optional[str] = None
    phone_strategy: Optional[str] = None
    resend_invoice: Optional[bool] = None

class InvoiceResponseData(BaseModel):
    created_at: datetime
    status: Optional[str] = None
    campaign_name: Optional[str] = None
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

from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from typing import List

from app.services.callRecord import record_service
from app.model.callRecord import (
    RecordCreate,
    RecordUpdate,
    Record,
    RecordResponse
)

router = APIRouter(
    prefix="/api/v1",
    tags=["records"]
)

@router.post("/records", response_model=RecordResponse)
async def create_record(request: RecordCreate):
    """Create a new record"""
    response = await record_service.create_record(request)
    if not response.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=response.message
        )
    return response

@router.get("/invoices", response_model=List[Invoice])
async def get_invoices():
    """Get all invoices"""
    return await invoice_service.get_invoices()

@router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: int):
    """Get an invoice by ID"""
    invoice = await invoice_service.get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    return invoice

@router.put("/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: int, update_data: InvoiceUpdate):
    """Update an invoice"""
    updated = await invoice_service.update_invoice(invoice_id, update_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    return updated

@router.put("/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice_by_job_id(invoice_id: int, request: InvoiceUpdate):
    """Update an invoice by job ID"""
    invoice = await invoice_service.update_invoice_by_job_id(invoice_id, request)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    return invoice

@router.delete("/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(invoice_id: int):
    """Delete an invoice"""
    success = await invoice_service.delete_invoice(invoice_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

@router.get("/invoices/phone/{phone_number}", response_model=List[Invoice])
async def get_invoices_by_phone(phone_number: str):
    """Get all invoices for a phone number"""
    return await invoice_service.get_invoices_by_phone(phone_number)

@router.post("/invoices/upload-csv", response_model=CSVUploadResponse)
async def upload_invoices_csv(
    file: UploadFile = File(...),
    campaign_name: str = Form(...),
    script: str = Form(...),
    phone_strategy: str = Form(...)
):
    """Upload a CSV file containing invoice information"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file"
        )
    
    response = await invoice_service.process_invoice_csv(file, campaign_name, script, phone_strategy)
    if not response.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=response.message
        )
    return response
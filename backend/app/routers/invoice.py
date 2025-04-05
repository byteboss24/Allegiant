from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from typing import List

from app.services.invoice import invoice_service
from app.model.invoice import (
    InvoiceCreate,
    InvoiceUpdate,
    Invoice,
    InvoiceResponse,
    CSVUploadResponse
)

router = APIRouter(
    prefix="/api/v1",
    tags=["invoices"]
)

@router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(request: InvoiceCreate):
    """Create a new invoice"""
    response = await invoice_service.create_invoice(request)
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

@router.get("/invoices/{invoice_number}", response_model=Invoice)
async def get_invoice(invoice_number: str):
    """Get an invoice by ID"""
    invoice = await invoice_service.get_invoice(invoice_number)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    return invoice

@router.put("/invoices/{invoice_number}", response_model=Invoice)
async def update_invoice(invoice_number: str, update_data: InvoiceUpdate):
    """Update an invoice"""
    print(invoice_number)
    updated = await invoice_service.update_invoice(invoice_number, update_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    return updated

@router.delete("/invoices/{invoice_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(invoice_number: str):
    """Delete an invoice"""
    success = await invoice_service.delete_invoice(invoice_number)
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
    campaign_name: str = Form(...)
):
    """Upload a CSV file containing invoice information"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file"
        )
    
    response = await invoice_service.process_invoice_csv(file, campaign_name)
    if not response.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=response.message
        )
    return response
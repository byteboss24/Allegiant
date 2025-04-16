from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from typing import List
from fastapi.responses import StreamingResponse
from app.model.invoice import InvoiceStatusUpdate
import csv
import io

from app.services.invoice import invoice_service
from app.model.invoice import (
    InvoiceCreate,
    InvoiceUpdate,
    Invoice,
    InvoiceResponse,
    CSVUploadResponse,
    MonthlyInvoiceStats
)
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/v1",
    tags=["invoices"]
)

# Request model for delete by body
class InvoiceDeleteRequest(BaseModel):
    invoice_numbers: List[str]

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

@router.get("/invoices/month", response_model=MonthlyInvoiceStats)
async def get_monthly_stats():
    """Get all invoices"""
    return await invoice_service.get_monthly_stats()

@router.put("/invoices/status", response_model=Invoice)
async def update_invoice_status(payload: InvoiceStatusUpdate):
    """Update an invoice status"""
    updated = await invoice_service.update_invoice_status(
        payload.invoice_number, 
        payload.status
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    return updated

@router.get("/invoices/{invoice_number}", response_model=Invoice)
async def get_invoice(invoice_number: str):
    """Get an invoice by invoice number"""
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
    updated = await invoice_service.update_invoice(invoice_number, update_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    return updated

@router.delete("/invoices/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice_by_body(request: InvoiceDeleteRequest):
    """Delete invoices by a list of invoice_numbers in request body"""
    failed = []
    for invoice_number in request.invoice_numbers:
        success = await invoice_service.delete_invoice(invoice_number)
        if not success:
            failed.append(invoice_number)
    if failed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoices not found: {failed}"
        )

@router.post("/invoices/upload-csv", response_model=CSVUploadResponse)
async def upload_invoices_csv(
    file: UploadFile = File(...),
    campaign_name: str = Form(...)
):
    """Upload a CSV file containing invoice information"""
    print("uploading csv")
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

@router.get("/invoices/export/csv")
async def export_invoices_csv():
    """Export all invoices as a properly formatted CSV file"""
    print("exporting csv")
    invoices = await invoice_service.get_invoices()
    
    # Create a StringIO object to write CSV data
    output = io.StringIO()
    writer = csv.DictWriter(
        output, 
        fieldnames=[
            'customer_id', 'first_name', 'last_name', 'salutation', 
            'file_number', 'mobile_number', 'phone_number', 'claim_reference',
            'invoice_number', 'invoice_date', 'invoice_amount', 'fsp_name',
            'outstanding_amount', 'email', 'mailing_postcode', 'payment_link',
            'call_status', 'campaign_name', 'script', 'phone_strategy', 'resend_invoice', 'status'
        ]
    )
    
    # Write header row
    writer.writeheader()
    
    # Write invoice data
    for invoice in invoices:
        # Convert invoice model to dict and handle any date formatting
        invoice_dict = invoice.model_dump()
        if invoice_dict.get('invoice_date'):
            invoice_dict['invoice_date'] = invoice_dict['invoice_date'].strftime('%Y-%m-%d')
        writer.writerow(invoice_dict)
    
    # Create a StreamingResponse with the CSV data
    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=invoices.csv"
    
    return response
from typing import List, Optional
from app.core.logger import logger
from app.model.invoice import InvoiceCreate, InvoiceUpdate, Invoice, InvoiceResponse, InvoiceResponseData, CSVUploadResponse
from app.services.mysql import mysql_service
from fastapi import UploadFile
import csv
from io import StringIO
from datetime import datetime, timezone
import json

class InvoiceService:
    def __init__(self):
        pass

    async def create_invoice(self, request: InvoiceCreate) -> InvoiceResponse:
        try:
            # Create invoice object
            invoice = Invoice(
                name=request.name,
                phone=request.phone,
                claim_reference=request.claim_reference,
                invoice_details=request.invoice_details,
                outstanding_amount=request.outstanding_amount,
                created_at=request.created_at,
            )
            
            # Insert into database
            invoice_id = await mysql_service.insert_invoice(invoice)
            if not invoice_id:
                raise Exception("Failed to insert invoice into database")
            
            # Get the created invoice from database
            created_invoice = await mysql_service.get_invoice(invoice_id)
            if not created_invoice:
                raise Exception("Failed to retrieve created invoice")
            
            return InvoiceResponse(
                success=True,
                message="Invoice created successfully",
                data=InvoiceResponseData(
                    invoice_id=created_invoice['id'],
                    name=created_invoice['name'],
                    phone=created_invoice['phone'],
                    claim_reference=created_invoice['claim_reference'],
                    invoice_details=created_invoice['invoice_details'],
                    outstanding_amount=float(created_invoice['outstanding_amount']),
                    created_at=created_invoice['created_at']
                )
            )
        except Exception as e:
            logger.error(f"Error creating invoice: {str(e)}")
            return InvoiceResponse(
                success=False,
                message=f"Invoice creation failed: {str(e)}"
            )

    async def get_invoice(self, invoice_id: int) -> Optional[Invoice]:
        try:
            invoice = await mysql_service.get_invoice(invoice_id)
            if not invoice:
                return None
            return Invoice.model_validate(invoice)
        except Exception as e:
            logger.error(f"Error getting invoice: {str(e)}")
            raise

    async def update_invoice(self, invoice_id: int, update_data: InvoiceUpdate) -> Optional[Invoice]:
        try:
            # First get the existing invoice
            existing = await self.get_invoice(invoice_id)
            if not existing:
                return None

            # Update only the fields that are provided
            update_dict = update_data.model_dump(exclude_unset=True)
            updated_invoice = await mysql_service.update_invoice(invoice_id, update_dict)
            
            return Invoice.model_validate(updated_invoice) if updated_invoice else None
        except Exception as e:
            logger.error(f"Error updating invoice: {str(e)}")
            raise

    async def delete_invoice(self, invoice_id: int) -> bool:
        try:
            return await mysql_service.delete_invoice(invoice_id)
        except Exception as e:
            logger.error(f"Error deleting invoice: {str(e)}")
            raise

    async def get_invoices(self) -> List[Invoice]:
        try:
            invoices = await mysql_service.get_invoices()
            if not invoices:
                return []
            return [Invoice.model_validate(invoice) for invoice in invoices]
        except Exception as e:
            logger.error(f"Error getting invoices: {str(e)}")
            raise
        
    async def get_invoice_by_id(self, invoice_id: int) -> Optional[Invoice]:
        try:
            invoice = await mysql_service.get_invoice_by_id(invoice_id)
            return Invoice.model_validate(invoice) if invoice else None
        except Exception as e:
            logger.error(f"Error getting invoice by id: {str(e)}")
            raise
    
    async def update_invoice_by_id(self, invoice_id: int, update_data: InvoiceUpdate) -> Optional[Invoice]:
        try:
            # Update only the fields that are provided
            update_dict = update_data.model_dump(exclude_unset=True)
            updated_invoice = await mysql_service.update_invoice(invoice_id, update_dict)
            return Invoice.model_validate(updated_invoice) if updated_invoice else None
        except Exception as e:
            logger.error(f"Error updating invoice: {str(e)}")
            raise

    async def process_invoice_csv(self, file: UploadFile, campaign_name: str, script: str, phone_strategy: str) -> CSVUploadResponse:
        try:
            # Read the CSV file content
            content = await file.read()
            csv_text = content.decode('utf-8')
            csv_file = StringIO(csv_text)
            csv_reader = csv.DictReader(csv_file)
            
            total_records = 0
            successful_records = 0
            failed_records = 0
            errors = []
            
            # Validate required columns
            required_columns = {'name', 'phone', 'outstanding_amount'}
            if not required_columns.issubset(csv_reader.fieldnames):
                missing_columns = required_columns - set(csv_reader.fieldnames)
                return CSVUploadResponse(
                    success=False,
                    message=f"Missing required columns: {', '.join(missing_columns)}",
                    total_records=0,
                    successful_records=0,
                    failed_records=0
                )
            
            for row in csv_reader:
                total_records += 1
                try:
                    # Validate required fields
                    if not row['name'] or not row['phone'] or not row['outstanding_amount']:
                        raise ValueError("Required fields cannot be empty")
                    
                    # Validate outstanding amount
                    try:
                        outstanding_amount = float(row['outstanding_amount'])
                        if outstanding_amount < 0:
                            raise ValueError("Outstanding amount cannot be negative")
                    except ValueError:
                        raise ValueError("Invalid outstanding amount format")
                    
                    # Create invoice from CSV row with campaign information
                    invoice = InvoiceCreate(
                        name=row['name'],
                        phone=row['phone'],
                        claim_reference=row['claim_reference'],
                        invoice_details=row['invoice_details'],
                        outstanding_amount=outstanding_amount,
                        created_at=datetime.now(timezone.utc), 
                    )

                    print(invoice)
                    
                    # Create the invoice
                    response = await self.create_invoice(invoice)
                    if response.success:
                        successful_records += 1
                    else:
                        failed_records += 1
                        errors.append(f"Row {total_records}: {response.message}")
                except Exception as e:
                    failed_records += 1
                    errors.append(f"Row {total_records}: {str(e)}")
            
            return CSVUploadResponse(
                success=True,
                message=f"Processed {total_records} records. {successful_records} successful, {failed_records} failed.",
                total_records=total_records,
                successful_records=successful_records,
                failed_records=failed_records,
                errors=errors if errors else None
            )
            
        except Exception as e:
            logger.error(f"Error processing CSV file: {str(e)}")
            return CSVUploadResponse(
                success=False,
                message=f"Failed to process CSV file: {str(e)}",
                total_records=0,
                successful_records=0,
                failed_records=0
            )

invoice_service = InvoiceService()

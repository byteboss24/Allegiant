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
                customer_id=request.customer_id,
                first_name=request.first_name,
                last_name=request.last_name,
                salutation=request.salutation,
                file_number=request.file_number,
                mobile_number=request.mobile_number,
                phone_number=request.phone_number,
                claim_reference=request.claim_reference,
                invoice_number=request.invoice_number,
                invoice_date=request.invoice_date,
                invoice_amount=request.invoice_amount,
                fsp_name=request.fsp_name,
                outstanding_amount=request.outstanding_amount,
                email=request.email,
                mailing_postcode=request.mailing_postcode
            )

            print("invoice", invoice)
            
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

    async def process_invoice_csv(self, file: UploadFile, campaign_name: str) -> CSVUploadResponse:
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
                    # Validate outstanding amount
                    try:
                        outstanding_amount = float(row['outstanding_amount'])
                        if outstanding_amount == "£ 0":
                            raise ValueError("Outstanding amount cannot be 0")
                    except ValueError:
                        raise ValueError("Invalid outstanding amount format")
                    
                    # Create invoice from CSV row with campaign information
                    invoice = InvoiceCreate(
                        customer_id=row['Customer ID'],
                        first_name=row['First Name'],
                        last_name=row['Last Name'],
                        salutation=row['Salutation'],
                        file_number=row['File Number'],
                        mobile_number=row['Mobile'],
                        phone_number=row['Phone'],
                        claim_reference=row['claim_reference'],
                        invoice_number=row['QB Invoice Number'],
                        invoice_date=row['Invoice Date'],
                        invoice_amount=row['Invoice Amount'],
                        fsp_name=row['FSP Quick Find (Credit Control)'],
                        outstanding_amount=row['Invoice Amount Paid'],
                        email=row['Email_Id'],
                        mailing_postcode=row['Mailing Postal Code'],
                        payment_link=row['Payment link'],
                        created_at=datetime.now(timezone.utc), 
                        campaign_name=campaign_name
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

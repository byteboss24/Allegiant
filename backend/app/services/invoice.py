from typing import List, Optional
from app.core.logger import logger
from app.model.invoice import InvoiceCreate, InvoiceUpdate, Invoice, InvoiceResponse, CSVUploadResponse
from app.services.mysql import mysql_service
from fastapi import UploadFile
import csv
from io import StringIO
from datetime import datetime, timezone

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

            # Insert into database
            invoice_id = await mysql_service.insert_invoice(invoice)
            if not invoice_id:
                raise Exception("Failed to insert invoice into database")
            
            # Get the created invoice from database
            created_invoice = await mysql_service.get_invoice(invoice_id)
            if not created_invoice:
                raise Exception("Failed to retrieve created invoice")
            
            print("Created invoice:", created_invoice)

            return InvoiceResponse(
                success=True,
                message="Invoice created successfully"
            )
        except Exception as e:
            logger.error(f"Error creating invoice: {e}")
            return InvoiceResponse(
                success=False,
                message=f"Invoice creation failed: {e}"
            )

    @classmethod
    async def get_invoice(cls, invoice_number: str) -> Optional[Invoice]:
        try:
            invoice = await mysql_service.get_invoice(invoice_number)
            if not invoice:
                return None
            return Invoice.model_validate(invoice)
        except Exception as e:
            logger.error(f"Error getting invoice: {e}")
            raise

    async def update_invoice(self, invoice_number: str, update_data: InvoiceUpdate) -> Optional[Invoice]:
        try:
            # First get the existing invoice
            existing = await self.get_invoice(invoice_number)
            if not existing:
                return None

            # Update only the fields that are provided
            update_dict = update_data.model_dump(exclude_unset=True)
            updated_invoice = await mysql_service.update_invoice(invoice_id, update_dict)
            
            return Invoice.model_validate(updated_invoice) if updated_invoice else None
        except Exception as e:
            logger.error(f"Error updating invoice: {e}")
            raise

    async def delete_invoice(self, invoice_id: int) -> bool:
        try:
            return await mysql_service.delete_invoice(invoice_id)
        except Exception as e:
            logger.error(f"Error deleting invoice: {e}")
            raise

    async def get_invoices(self) -> List[Invoice]:
        try:
            invoices = await mysql_service.get_invoices()
            if not invoices:
                return []
            return [Invoice.model_validate(invoice) for invoice in invoices]
        except Exception as e:
            logger.error(f"Error getting invoices: {e}")
            raise
        
    async def get_invoice_by_id(self, invoice_id: int) -> Optional[Invoice]:
        try:
            invoice = await mysql_service.get_invoice_by_id(invoice_id)
            return Invoice.model_validate(invoice) if invoice else None
        except Exception as e:
            logger.error(f"Error getting invoice by id: {e}")
            raise
    
    async def update_invoice_by_id(self, invoice_id: int, update_data: InvoiceUpdate) -> Optional[Invoice]:
        try:
            # Update only the fields that are provided
            update_dict = update_data.model_dump(exclude_unset=True)
            updated_invoice = await mysql_service.update_invoice(invoice_id, update_dict)
            return Invoice.model_validate(updated_invoice) if updated_invoice else None
        except Exception as e:
            logger.error(f"Error updating invoice: {e}")
            raise

    async def process_invoice_csv(self, file: UploadFile, campaign_name: str) -> CSVUploadResponse:
        try:
            # Read the CSV file content
            content = await file.read()
            csv_text = content.decode('utf-8')
            csv_file = StringIO(csv_text)
            csv_reader = csv.DictReader(csv_file)
            
            # Clean field names by removing BOM if present
            fieldnames = [field.strip('\ufeff') for field in csv_reader.fieldnames]
            
            total_records = 0
            successful_records = 0
            failed_records = 0
            errors = []
            
            print("Processing CSV2...")
            
            for row in csv_reader:
                total_records += 1
                try:
                    # Map CSV fields to model with error handling
                    try:
                        try:
                            invoice_date = (
                                datetime.strptime(row.get('Invoice Date', ''), '%d.%m.%Y') if row.get('Invoice Date') 
                                else datetime.now()
                            )
                        except ValueError:
                            # Fallback to current date if parsing fails
                            invoice_date = datetime.now()
                            
                        invoice_data = {
                            'customer_id': row.get('\ufeffCustomer ID', row.get('Customer ID', '')),
                            'first_name': row.get('First Name', ''),
                            'last_name': row.get('Last Name', ''),
                            'salutation': row.get('Salutation', ''),
                            'file_number': row.get('File Number', ''),
                            'mobile_number': row.get('Mobile', ''),
                            'phone_number': row.get('Phone', ''),
                            'claim_reference': row.get('claim_reference', ''),
                            'invoice_number': row.get('QB Invoice Number', ''),
                            'invoice_date': invoice_date,
                            'invoice_amount': row.get('Invoice Amount', ''),
                            'fsp_name': row.get('FSP Quick Find (Credit Control)', ''),
                            'outstanding_amount': row.get('Invoice Amount Paid', ''),
                            'email': row.get('Email_Id', ''),
                            'mailing_postcode': row.get('Mailing Postal Code', ''),
                            'payment_link': row.get('Payment link', ''),
                            'created_at': datetime.now(timezone.utc),
                            'campaign_name': campaign_name
                        }
                        
                        invoice = InvoiceCreate(**invoice_data)
                    except Exception as e:
                        print(f"Error creating invoice from row: {e}")
                        raise
                    
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
            logger.error(f"Error processing CSV file: {e}")
            return CSVUploadResponse(
                success=False,
                message=f"Failed to process CSV file: {e}",
                total_records=0,
                successful_records=0,
                failed_records=0
            )

invoice_service = InvoiceService()

import pymysql
from app.core.config import settings
import json

class MySQLService:
    def __init__(self):
        self.config = {
            "host": settings.DB_HOST,
            "user": settings.DB_USER,
            "password": settings.DB_PASSWORD,
            "db": settings.DB_NAME,
            "port": settings.DB_PORT,
            "charset": "utf8mb4",
            "cursorclass": pymysql.cursors.DictCursor,
            "connect_timeout": 10,
            "read_timeout": 10,
            "write_timeout": 10
        }

    def _get_connection(self):
        return pymysql.connect(**self.config)
    
    def initialize(self):
        """Create the required tables if they don't exist"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS invoices (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255),
                        phone VARCHAR(20),
                        claim_reference JSON,
                        invoice_details JSON,
                        outstanding_amount DECIMAL(10,4),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        call_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                        campaign_name VARCHAR(255),
                        script VARCHAR(50),
                        phone_strategy VARCHAR(50)
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS customers (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255),
                        phone VARCHAR(20),
                        claim_reference VARCHAR(255),
                        invoice_details JSON,
                        outstanding_amount DECIMAL(10,4),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        call_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending'
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS calls (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        customer_id INT,
                        status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                        transcript TEXT,
                        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        ended_at TIMESTAMP NULL,
                        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS payments (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        customer_id INT,
                        amount DECIMAL(10,2),
                        status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
                        transaction_id VARCHAR(255) UNIQUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS call_logs (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        call_id INT,
                        conversation_data JSON,
                        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
                    )
                """)
            connection.commit()
        finally:
            connection.close()
    
    async def insert_customer(self, name, phone, claim_reference, invoice_details):
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                    INSERT INTO customers (name, phone, claim_reference, invoice_details)
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(sql, (name, phone, claim_reference, json.dumps(invoice_details)))
                connection.commit()
                return cursor.lastrowid
        finally:
            connection.close()
    
    async def insert_call(self, customer_id, status):
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                    INSERT INTO calls (customer_id, status)
                    VALUES (%s, %s)
                """
                cursor.execute(sql, (customer_id, status))
                connection.commit()
                return cursor.lastrowid
        finally:
            connection.close()
    
    async def insert_payment(self, customer_id, amount, status, transaction_id):
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                    INSERT INTO payments (customer_id, amount, status, transaction_id)
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(sql, (customer_id, amount, status, transaction_id))
                connection.commit()
                return cursor.lastrowid
        finally:
            connection.close()
    
    async def insert_call_log(self, call_id, conversation_data):
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                    INSERT INTO call_logs (call_id, conversation_data)
                    VALUES (%s, %s)
                """
                cursor.execute(sql, (call_id, json.dumps(conversation_data)))
                connection.commit()
                return cursor.lastrowid
        finally:
            connection.close()
    
    async def get_customer_by_phone(self, phone):
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM customers WHERE phone = %s", (phone,))
                return cursor.fetchone()
        finally:
            connection.close()
    
    async def update_call_status(self, call_id, status, transcript=None):
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = "UPDATE calls SET status = %s, ended_at = CURRENT_TIMESTAMP"
                values = [status]
                if transcript:
                    sql += ", transcript = %s"
                    values.append(transcript)
                sql += " WHERE id = %s"
                values.append(call_id)
                cursor.execute(sql, values)
                connection.commit()
        finally:
            connection.close()
    
    async def update_payment_status(self, payment_id, status):
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = "UPDATE payments SET status = %s WHERE id = %s"
                cursor.execute(sql, (status, payment_id))
                connection.commit()
        finally:
            connection.close()

    async def insert_invoice(self, invoice):
        """Insert a new invoice into the database"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                    INSERT INTO invoices (
                        name, phone, claim_reference, invoice_details,
                        outstanding_amount, created_at
                    )
                    VALUES (%s, %s, %s, %s, %f, %s)
                """

                print(invoice)

                cursor.execute(sql, (
                    invoice.name,
                    invoice.phone,
                    invoice.claim_reference,
                    invoice.invoice_details,
                    invoice.outstanding_amount,
                    invoice.created_at
                ))
                connection.commit()
                return cursor.lastrowid
        finally:
            connection.close()

    async def get_invoice(self, invoice_id):
        """Get an invoice by ID"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM invoices WHERE id = %s", (invoice_id,))
                return cursor.fetchone()
        finally:
            connection.close()

    async def get_invoices(self):
        """Get all invoices"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM invoices")
                return cursor.fetchall()
        finally:
            connection.close()

    async def update_invoice(self, invoice_id, update_data):
        """Update an invoice"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                set_clause = ", ".join([f"{k} = %s" for k in update_data.keys()])
                sql = f"UPDATE invoices SET {set_clause} WHERE id = %s"
                values = list(update_data.values()) + [invoice_id]
                cursor.execute(sql, values)
                connection.commit()
                return await self.get_invoice(invoice_id)
        finally:
            connection.close()

    async def delete_invoice(self, invoice_id):
        """Delete an invoice"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM invoices WHERE id = %s", (invoice_id,))
                connection.commit()
                return cursor.rowcount > 0
        finally:
            connection.close()

    async def get_invoices_by_phone(self, phone):
        """Get all invoices for a phone number"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM invoices WHERE phone = %s", (phone,))
                return cursor.fetchall()
        finally:
            connection.close()

mysql_service = MySQLService()

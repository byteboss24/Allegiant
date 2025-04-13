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
                        customer_id VARCHAR(255),
                        first_name VARCHAR(255),
                        last_name VARCHAR(255),
                        salutation VARCHAR(255),
                        file_number VARCHAR(255),
                        mobile_number VARCHAR(255),
                        phone_number VARCHAR(255),
                        claim_reference VARCHAR(255),
                        invoice_number VARCHAR(255) UNIQUE,
                        invoice_date DATETIME,
                        invoice_amount VARCHAR(255),
                        fsp_name VARCHAR(255),
                        outstanding_amount VARCHAR(255),
                        email VARCHAR(255),
                        mailing_postcode VARCHAR(255),
                        payment_link VARCHAR(255)
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS customers (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255),
                        phone VARCHAR(255),
                        claim_reference VARCHAR(255),
                        invoice_details JSON,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS calls (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        invoice_number VARCHAR(255),
                        status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                        transcript TEXT,
                        audio_url VARCHAR(255),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        ended_at TIMESTAMP NULL,
                        duration DECIMAL(10,2) DEFAULT 0
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS payments (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        invoice_number VARCHAR(255),
                        amount DECIMAL(10,2),
                        status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
                        transaction_id VARCHAR(255) UNIQUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS agents (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        status ENUM('active', 'inactive') DEFAULT 'inactive',
                        voice VARCHAR(255) DEFAULT 'ballad',
                        system_prompt TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
                        customer_id,
                        first_name,
                        last_name,
                        salutation,
                        file_number,
                        mobile_number,
                        phone_number,
                        claim_reference,
                        invoice_number,
                        invoice_date,
                        invoice_amount,
                        fsp_name,
                        outstanding_amount,
                        email,
                        mailing_postcode,
                        payment_link
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """

                cursor.execute(sql, (
                    invoice.customer_id,
                    invoice.first_name,
                    invoice.last_name,
                    invoice.salutation,
                    invoice.file_number,
                    invoice.mobile_number,
                    invoice.phone_number,
                    invoice.claim_reference,
                    invoice.invoice_number,
                    invoice.invoice_date,
                    invoice.invoice_amount,
                    invoice.fsp_name,
                    invoice.outstanding_amount,
                    invoice.email,
                    invoice.mailing_postcode,
                    invoice.payment_link
                ))
                connection.commit()
                return cursor.lastrowid
        finally:
            connection.close()

    async def get_invoice(self, invoice_number):
        """Get an invoice by ID"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM invoices WHERE invoice_number = %s", (invoice_number))
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

    async def get_invoices_to_process(self):
        """Get all invoices to process"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM invoices WHERE status != 'completed' and status != 'calling' limit 10")
                return cursor.fetchall()
        finally:
            connection.close()

    async def update_invoice(self, invoice_number, update_data):
        """Update an invoice"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                set_clause = ", ".join([f"{k} = %s" for k in update_data.keys()])
                sql = f"UPDATE invoices SET {set_clause} WHERE invoice_number = %s"
                values = list(update_data.values()) + [invoice_number]
                cursor.execute(sql, values)
                connection.commit()
                return await self.get_invoice(invoice_number)
        finally:
            connection.close()

    async def delete_invoice(self, invoice_number):
        """Delete an invoice"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM invoices WHERE invoice_number = %s", (invoice_number,))
                connection.commit()
                return cursor.rowcount > 0
        finally:
            connection.close()

    async def get_agents(self):
        """Get all agents from the database"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM agents")
                return cursor.fetchall()
        finally:
            connection.close()
    
    async def get_agent_by_id(self, agent_id):
        """Get an agent by ID"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM agents WHERE id = %s", (agent_id))
                return cursor.fetchone()
        finally:
            connection.close()
    
    async def insert_agent(self, name, system_prompt, voice="alloy", status="inactive"):
        """Insert a new agent into the database"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                    INSERT INTO agents (name, system_prompt, voice, status)
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(sql, (name, system_prompt, voice, status))
                connection.commit()
                return cursor.lastrowid
        finally:
            connection.close()
    
    async def update_agent(self, agent_id, **kwargs):
        """Update an agent in the database"""
        if not kwargs:
            return
        
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                set_clause = ", ".join([f"{key} = %s" for key in kwargs.keys()])
                sql = f"UPDATE agents SET {set_clause} WHERE id = %s"
                cursor.execute(sql, list(kwargs.values()) + [agent_id])
                connection.commit()
        finally:
            connection.close()
    
    async def delete_agent(self, agent_id):
        """Delete an agent from the database"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = "DELETE FROM agents WHERE id = %s"
                cursor.execute(sql, (agent_id,))
                connection.commit()
                return cursor.rowcount > 0
        finally:
            connection.close()
    
    async def insert_record(self, record):
        """Insert a call record into the database"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                print(record)
                sql = """
                    INSERT INTO calls (invoice_number, duration, transcript, audio_url, status)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(sql, (record.invoice_number, record.duration, record.transcript, record.audio_url, record.status))
                connection.commit()
                return cursor.lastrowid
        finally:
            connection.close()
    
    async def update_record(self, record_id, record):
        """Update a call record in the database"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                    UPDATE calls
                    SET invoice_number = %s,
                        duration = %s,
                        transcript = %s,
                        audio_url = %s,
                        status = %s
                    WHERE id = %s
                """
                cursor.execute(sql, (record.invoice_number, record.duration, record.transcript, record.audio_url, record.status, record_id))
                connection.commit()
                return cursor.rowcount > 0
        finally:
            connection.close()

    async def get_records(self):
        """Get All records from the database"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM calls")
                return cursor.fetchall()
        finally:
            connection.close()
    
    async def get_record(self, id):
        """Get record with id from the database"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM calls WHERE id = %d", (id,))
                return cursor.fetchone()
        finally:
            connection.close()

    async def get_record_week(self):
        """Get daily call statistics grouped by status for the last 7 days"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    WITH RECURSIVE date_range AS (
                        SELECT DATE(NOW()) as date
                        UNION ALL
                        SELECT DATE_SUB(date, INTERVAL 1 DAY)
                        FROM date_range
                        WHERE date > DATE_SUB(NOW(), INTERVAL 6 DAY)
                    ),
                    daily_stats AS (
                        SELECT 
                            DATE(created_at) as date,
                            COUNT(*) as total_calls,
                            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_calls,
                            SUM(CASE WHEN status != 'completed' THEN 1 ELSE 0 END) as other_calls
                        FROM calls 
                        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                        GROUP BY DATE(created_at)
                    )
                    SELECT 
                        dr.date,
                        COALESCE(ds.total_calls, 0) as total_calls,
                        COALESCE(ds.completed_calls, 0) as completed_calls,
                        COALESCE(ds.other_calls, 0) as other_calls
                    FROM date_range dr
                    LEFT JOIN daily_stats ds ON dr.date = ds.date
                    ORDER BY dr.date ASC
                """)
                return cursor.fetchall()
        finally:
            connection.close()

    async def get_record_recent(self, limit=10):
        """Get recent call records with customer names from the database"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        c.*,
                        i.first_name,
                        i.last_name
                    FROM calls c
                    LEFT JOIN invoices i ON c.invoice_number = i.invoice_number
                    ORDER BY c.created_at DESC
                    LIMIT %s
                """, (limit,))
                return cursor.fetchall()
        finally:
            connection.close()

    async def delete_record(self, id):
        """Delete a record with id from the database"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM calls WHERE id = %d", (id,))
                connection.commit()
                return cursor.rowcount > 0
        finally:
            connection.close()

mysql_service = MySQLService()

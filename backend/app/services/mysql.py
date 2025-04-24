import pymysql
from app.core.config import settings

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
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS word_pronunciations (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        agent_id INT,
                        word VARCHAR(255),
                        pronunciation TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                """)
            connection.commit()
        finally:
            connection.close()
    
    async def insert_invoice(self, invoice):
        """Insert a new invoice into the database"""
        connection = self._get_connection()
        print("Inserting invoice", invoice)
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
                        payment_link,
                        status
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                    invoice.payment_link,
                    invoice.status
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

    async def get_invoices(self, page: int = 1, page_size: int = 10, search: str = None):
        """Get paginated and optionally searched invoices"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                offset = (page - 1) * page_size
                params = []
                where_clause = ""
                if search:
                    where_clause = "WHERE first_name LIKE %s OR last_name LIKE %s OR invoice_number LIKE %s OR mobile_number LIKE %s OR phone_number LIKE %s"
                    search_term = f"%{search}%"
                    params.extend([search_term, search_term, search_term, search_term, search_term])
                count_sql = f"SELECT COUNT(*) as total FROM invoices {where_clause}"
                cursor.execute(count_sql, params)
                result = cursor.fetchone()
                total = result["total"] if result else 0
                sql = f"SELECT * FROM invoices {where_clause} ORDER BY invoice_date DESC LIMIT %s OFFSET %s"
                params.extend([page_size, offset])
                cursor.execute(sql, params)
                items = cursor.fetchall()
                return items, total
        finally:
            connection.close()

    async def get_monthly_invoice_stats(self):
        """Get this month's invoice completion statistics and call stats"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                # Invoice stats
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_invoices,
                        SUM(CASE WHEN `status` = 'completed' THEN 1 ELSE 0 END) as completed_invoices,
                        ROUND((SUM(CASE WHEN `status` = 'completed' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as completion_rate
                    FROM invoices 
                    WHERE MONTH(invoice_date) = MONTH(CURRENT_DATE())
                    AND YEAR(invoice_date) = YEAR(CURRENT_DATE())
                """)
                invoice_result = cursor.fetchone()

                # Call stats
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_calls,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_calls,
                        SUM(CASE WHEN status = 'sms' THEN 1 ELSE 0 END) as sms_sent_calls
                    FROM calls
                    WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
                    AND YEAR(created_at) = YEAR(CURRENT_DATE())
                """)
                call_result = cursor.fetchone()

                return {
                    'total_invoices': invoice_result['total_invoices'] or 0,
                    'completed_invoices': invoice_result['completed_invoices'] or 0,
                    'completion_rate': invoice_result['completion_rate'] or 0.0,
                    'total_calls': call_result['total_calls'] or 0,
                    'completed_calls': call_result['completed_calls'] or 0,
                    'sms_sent_calls': call_result['sms_sent_calls'] or 0
                }
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

    async def update_invoice_status(self, invoice_number: str, status: str):
        """Update an invoice's status"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = "UPDATE invoices SET status = %s WHERE invoice_number = %s"
                cursor.execute(sql, (status, invoice_number))
                connection.commit()
                return await self.get_invoice(invoice_number)
        finally:
            connection.close()

    async def delete_invoice(self, invoice_number):
        """Delete an invoice and all associated records"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                # Delete all records with this invoice_number
                cursor.execute("DELETE FROM calls WHERE invoice_number = %s", (invoice_number,))
                # Delete the invoice itself
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

    async def get_records(self, page: int = 1, per_page: int = 10):
        """Get all records with pagination"""
        offset = (page - 1) * per_page
        
        # Get total count
        count_query = "SELECT COUNT(*) as total FROM calls"
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(count_query)
                total = cursor.fetchone()
        finally:
            connection.close()
        
        # Get paginated records
        query = f"""
            SELECT
                c.*,
                CONCAT(i.first_name, ' ', i.last_name) AS name
            FROM calls c
            JOIN invoices i ON c.invoice_number = i.invoice_number
            ORDER BY created_at DESC 
            LIMIT {per_page} OFFSET {offset}
        """
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(query)
                records = cursor.fetchall()
                return {
                    "items": records,
                    "total": total["total"] if total else 0
                }
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

    async def get_record_recent(self, limit=5):
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
                    LIMIT 5
                """)
                return cursor.fetchall()
        finally:
            connection.close()

    async def delete_record(self, id):
        """Delete a record with id from the database"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM calls WHERE id = %s", (id,))
                connection.commit()
                return cursor.rowcount > 0
        finally:
            connection.close()
    
    async def get_today_status(self):
        """Get today's call statistics"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_calls,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_calls,
                        SUM(CASE WHEN status != 'completed' THEN 1 ELSE 0 END) as other_calls
                    FROM calls
                    WHERE DATE(created_at) = DATE(NOW())
                """)
                return cursor.fetchone()
        finally:
            connection.close()

    async def get_yesterday_status(self):
        """Get yesterday's call statistics"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_calls,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_calls,
                        SUM(CASE WHEN status != 'completed' THEN 1 ELSE 0 END) as other_calls
                    FROM calls
                    WHERE DATE(created_at) = DATE_SUB(DATE(NOW()), INTERVAL 1 DAY)
                """)
                return cursor.fetchone()
        finally:
            connection.close()

    async def insert_word_pronunciation(self, agent_id, word, pronunciation):
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                    INSERT INTO word_pronunciations (agent_id, word, pronunciation, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                """
                cursor.execute(sql, (agent_id, word, pronunciation))
                connection.commit()
                return cursor.lastrowid
        finally:
            connection.close()

    async def get_word_pronunciations(self, agent_id=None):
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                if agent_id is not None:
                    cursor.execute("SELECT * FROM word_pronunciations WHERE agent_id = %s", (agent_id,))
                else:
                    cursor.execute("SELECT * FROM word_pronunciations")
                return cursor.fetchall()
        finally:
            connection.close()

    async def update_word_pronunciation(self, item_id, word, pronunciation):
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                    UPDATE word_pronunciations SET word = %s, pronunciation = %s, updated_at = NOW() WHERE id = %s
                """
                cursor.execute(sql, (word, pronunciation, item_id))
                connection.commit()
                return cursor.rowcount > 0
        finally:
            connection.close()

    async def delete_word_pronunciation(self, item_id):
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM word_pronunciations WHERE id = %s", (item_id,))
                connection.commit()
                return cursor.rowcount > 0
        finally:
            connection.close()

    async def get_all_invoices(self):
        """Get all invoices from the database"""
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM invoices ORDER BY invoice_date DESC")
                return cursor.fetchall()
        finally:
            connection.close()

mysql_service = MySQLService()

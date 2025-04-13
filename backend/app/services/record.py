from typing import List, Optional
from app.model.record import Record
from app.services.mysql import mysql_service

class RecordService:
    def __init__(self):
        pass

    async def get_records(self) -> List[Record]:
        return await mysql_service.get_records()

    async def get_record_by_id(self, record_id: int) -> Optional[Record]:
        return await mysql_service.get_record(record_id)

    async def create_record(self, record: Record) -> Optional[Record]:
        return await mysql_service.insert_record(record)

    async def update_record(self, record_id: int, record: Record) -> Optional[Record]:
        return await mysql_service.update_record(record_id, record)

    async def delete_record(self, record_id: int) -> bool:
        return await mysql_service.delete_record(record_id)

record_service = RecordService()

from typing import List, Optional
from app.model.record import Record, WeeklyStats, RecentStats
from app.services.mysql import mysql_service

class RecordService:
    def __init__(self):
        pass

    async def get_records(self, page: int = 1, per_page: int = 10) -> dict:
        """Get paginated records"""
        return await mysql_service.get_records(page, per_page)

    async def get_record_by_id(self, record_id: int) -> Optional[Record]:
        return await mysql_service.get_record(record_id)

    async def create_record(self, record: Record) -> Optional[Record]:
        return await mysql_service.insert_record(record)

    async def get_record_week(self) -> List[WeeklyStats]:
        raw_data = await mysql_service.get_record_week()
        
        # Convert data types to match WeeklyStats model
        formatted_data = []
        for item in raw_data:
            formatted_data.append({
                "date": item["date"].isoformat(),  # Convert date to string
                "total_calls": int(item["total_calls"]),
                "completed_calls": int(item["completed_calls"]),
                "other_calls": int(item["other_calls"])
            })
        
        return formatted_data
    
    async def get_record_recent(self, limit: int = 10) -> List[RecentStats]:
        return await mysql_service.get_record_recent(limit)

    async def update_record(self, record_id: int, record: Record) -> Optional[Record]:
        return await mysql_service.update_record(record_id, record)

    async def delete_record(self, record_id: int) -> bool:
        return await mysql_service.delete_record(record_id)

record_service = RecordService()

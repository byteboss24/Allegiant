from typing import List, Dict
from fastapi import APIRouter
from app.services.record import record_service
from app.model.record import Record, RecordCreate, WeeklyStats, RecentStats

router = APIRouter(
    prefix="/api/v1",
    tags=["record"]
)

@router.get("/records")
async def get_records(page: int = 1, per_page: int = 10) -> Dict:
    """Get paginated records"""
    return await record_service.get_records(page, per_page)

@router.get("/record/week", response_model=List[WeeklyStats])
async def get_record_week():
    return await record_service.get_record_week()

@router.get("/record/recent", response_model=List[RecentStats])
async def get_record_recent(limit: int = 10):
    return await record_service.get_record_recent(limit)

@router.get("/record/{id}", response_model=Record)
async def get_record(id: int):
    return await record_service.get_record_by_id(id)

@router.post("/record")
async def create_record(request: RecordCreate):
    return await record_service.create_record(request)

@router.delete("/record/{id}")
async def delete_record(id: int):
    return await record_service.delete_record(id)
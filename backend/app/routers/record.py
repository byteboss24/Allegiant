from typing import List, Dict
from fastapi import APIRouter, Query
from app.services.record import record_service
from app.model.record import Record, RecordCreate, WeeklyStats, RecentStats, TodayStatus

router = APIRouter(
    prefix="/api/v1",
    tags=["record"]
)

@router.get("/records/today", response_model=TodayStatus)
async def get_today_status():
    print("Getting today's status...")
    return await record_service.get_today_status()

@router.get("/records/yesterday", response_model=TodayStatus)
async def get_yesterday_status():
    print("Getting yesterday's status...")
    return await record_service.get_yesterday_status()

@router.get("/records")
async def get_records(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None)
) -> Dict:
    """Get paginated, searched, and filtered records"""
    return await record_service.get_records(page, per_page, search, status)

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
    print("Deleting record with id:", id)
    return await record_service.delete_record(id)

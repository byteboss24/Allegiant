from typing import List
from fastapi import APIRouter
from app.services.record import record_service
from app.model.record import Record, RecordCreate

router = APIRouter(
    prefix="/api/v1",
    tags=["record"]
)

@router.get("/records", response_model=List[Record])
async def get_records():
    return await record_service.get_records()

@router.get("/record/{id}", response_model=Record)
async def get_record(id: int):
    return await record_service.get_record_by_id(id)

@router.post("/record")
async def create_record(request: RecordCreate):
    return await record_service.create_record(request)

@router.delete("/record/{id}")
async def delete_record(id: int):
    return await record_service.delete_record(id)
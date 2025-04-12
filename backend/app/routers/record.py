from typing import List
from fastapi import APIRouter
from app.services.mysql import mysql_service
from app.model.call import Call, CallCreate

router = APIRouter(
    prefix="/api/v1",
    tags=["record"]
)

@router.get("/records", response_model=List[Call])
async def get_records():
    return await mysql_service.get_records()

@router.get("/record/{id}", response_model=Call)
async def get_record(id: int):
    return await mysql_service.get_record(id)

@router.post("/record")
async def create_record(request: CallCreate):
    return await mysql_service.insert_call(request)

@router.delete("/record/{id}")
async def delete_record(id: int):
    return await mysql_service.delete_record(id)
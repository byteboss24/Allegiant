from typing import List, Optional
from fastapi import APIRouter
from app.model.word_pronunciation import WordPronunciation
from app.services.word_pronunciation import word_pronunciation_service

router = APIRouter(
    prefix="/api/v1",
    tags=["word_pronunciation"]
)

@router.get("/word-pronunciations", response_model=List[WordPronunciation])
async def get_word_pronunciations(agent_id: Optional[int] = None):
    return await word_pronunciation_service.get_word_pronunciations(agent_id)

@router.post("/word-pronunciations", response_model=WordPronunciation)
async def create_word_pronunciation(item: WordPronunciation):
    return await word_pronunciation_service.create_word_pronunciation(item)

@router.put("/word-pronunciations/{item_id}", response_model=WordPronunciation)
async def update_word_pronunciation(item_id: int, item: WordPronunciation):
    return await word_pronunciation_service.update_word_pronunciation(item_id, item)

@router.delete("/word-pronunciations/{item_id}")
async def delete_word_pronunciation(item_id: int):
    return await word_pronunciation_service.delete_word_pronunciation(item_id) 
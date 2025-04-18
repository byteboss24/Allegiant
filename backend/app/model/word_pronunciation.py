from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class WordPronunciation(BaseModel):
    id: Optional[int] = None
    agent_id: Optional[int] = None  # If per agent, else remove
    word: str
    pronunciation: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 
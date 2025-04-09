from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Agent(BaseModel):
    id: Optional[int] = None
    name: str
    status: Optional[str] = "inactive"
    voice: str
    system_prompt: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
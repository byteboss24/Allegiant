from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    # Twilio credentials
    twilio_account_sid: str
    twilio_auth_token: str
    # OpenAI
    openai_api_key: str
    # Github
    github_token: Optional[str] = None
    # MySQL Database
    DB_NAME: str
    DB_HOST: str
    DB_PASSWORD: str
    DB_USER: str
    DB_PORT: int
    # FastAPI Domain
    fastapi_domain: str
    # Agent Settings
    agent_id: Optional[int] = None
    voice_type: Optional[str] = None
    system_prompt: Optional[str] = None
    call_count: Optional[int] = 0
    active: Optional[bool] = False
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

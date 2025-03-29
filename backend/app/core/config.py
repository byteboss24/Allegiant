from enum import Enum
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
    
    class Config:
        env_file = ".env"
        case_sensitive = True

class ModelType(str, Enum):
    GPT4O = 'gpt-4'
    GPT35 = 'gpt-3.5-turbo'
    WHISPER = 'whisper-1'
    TTS = 'tts-1'

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

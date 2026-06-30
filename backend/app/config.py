from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/hozmir"
    DATABASE_SYNC_URL: str = "postgresql+psycopg://user:password@localhost:5432/hozmir"

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Backblaze B2
    B2_KEY_ID: str = ""
    B2_APP_KEY: str = ""
    B2_BUCKET_NAME: str = "hozmir-photos"
    B2_ENDPOINT_URL: str = "https://s3.us-west-004.backblazeb2.com"

    # Telegram
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # App
    APP_NAME: str = "Хоз Мир"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = False
    CORS_ORIGINS: str = '["http://localhost:5173"]'

    def get_cors_origins(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

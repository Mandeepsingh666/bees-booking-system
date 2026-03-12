from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/shellby_suits"
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    GMAIL_USER: Optional[str] = None
    GMAIL_APP_PASSWORD: Optional[str] = None
    OWNER_EMAIL: Optional[str] = None

    UPLOAD_DIR: str = "uploads"
    PDF_DIR: str = "pdfs"

    OWNER_USERNAME: str = "owner"
    OWNER_PASSWORD: str = "OwnerPass123!"
    OWNER_EMAIL_DEFAULT: str = "owner@shelbeessuites.com"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

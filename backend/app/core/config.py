from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Static 

    # Database settings
    database_url: str = "postgresql://user:pass@localhost:5432/dropzone_db"
    
    # Security settings
    secret_key: str = "your-secret-key-here"
    
    # Application settings
    environment: str = "development"
    telegram_bot_token: Optional[str] = None
    telegram_bot_username: Optional[str] = None
    
    # JWT settings
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"
    
    # MinIO settings
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin123"
    minio_bucket_name: str = "dropzone-files"
    minio_secure: bool = False
    files_base_url: str = "http://localhost/files"
    
    class Config:
        case_sensitive = False
        # Environment variables are loaded with this priority:
        # 1. Environment variables (from Docker Compose)
        # 2. Default values specified in the Settings class

settings = Settings()

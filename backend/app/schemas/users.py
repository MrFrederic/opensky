from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.base import UserStatus


class UserBase(BaseModel):
    first_name: str
    last_name: str
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: UserStatus = UserStatus.NEWBY
    is_admin: bool = False


class UserCreate(UserBase):
    telegram_id: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[UserStatus] = None
    is_admin: Optional[bool] = None
    license_document_url: Optional[str] = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    telegram_id: str
    license_document_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    first_name: str
    last_name: str
    username: Optional[str] = None
    status: UserStatus


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TelegramAuthData(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    auth_date: int
    hash: str

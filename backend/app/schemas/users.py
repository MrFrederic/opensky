from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.base import UserRole


class UserRoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    role: UserRole
    created_at: datetime


class UserBase(BaseModel):
    first_name: str
    last_name: str
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    telegram_id: str
    roles: Optional[List[UserRole]] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    license_document_url: Optional[str] = None


class UserRoleUpdate(BaseModel):
    roles: List[UserRole]


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    telegram_id: str
    license_document_url: Optional[str] = None
    roles: List[UserRoleResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    first_name: str
    last_name: str
    username: Optional[str] = None
    roles: List[UserRole] = []


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    # Don't include refresh token here, it will be set in a cookie


class TokenData(BaseModel):
    telegram_id: Optional[str] = None
    user_id: Optional[int] = None


class RefreshTokenRequest(BaseModel):
    client_info: Optional[str] = None  # For tracking devices/browsers

class TelegramAuthData(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str

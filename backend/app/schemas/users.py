from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from app.models.enums import UserRole, Gender
from app.core.validators import EmptyStrToNoneMixin


# =============================================================================
# USER CORE SCHEMAS
# =============================================================================

class UserBase(BaseModel, EmptyStrToNoneMixin):
    """Base user model with common fields"""
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    display_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    gender: Optional[Gender] = None
    photo_url: Optional[str] = None
    medical_clearance_date: Optional[date] = None
    medical_clearance_is_confirmed: Optional[bool] = False
    is_active: Optional[bool] = True


class UserRoleResponse(BaseModel):
    """Response model for user role information"""
    model_config = ConfigDict(from_attributes=True)
    
    role: UserRole
    created_at: datetime


# =============================================================================
# USER REQUEST/RESPONSE SCHEMAS
# =============================================================================

class UserCreate(UserBase):
    """Schema for creating a new user"""
    telegram_id: Optional[str] = None
    roles: Optional[List[UserRole]] = None
    photo_url: Optional[str] = None


class UserUpdate(BaseModel, EmptyStrToNoneMixin):
    """Schema for updating user information (all fields optional)"""
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    gender: Optional[Gender] = None
    photo_url: Optional[str] = None
    medical_clearance_date: Optional[date] = None
    medical_clearance_is_confirmed: Optional[bool] = None
    is_active: Optional[bool] = None
    roles: Optional[List[UserRole]] = None


class UserResponse(UserBase):
    """Full user response with all details"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    telegram_id: Optional[str] = None
    roles: List[UserRoleResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.enums import UserRole


# =============================================================================
# JUMP TYPE CORE SCHEMAS
# =============================================================================

class JumpTypeBase(BaseModel):
    """Base jump type model with common fields"""
    name: str
    short_name: str
    description: Optional[str] = None
    exit_altitude: Optional[int] = None
    price: Optional[int] = None
    is_available: Optional[bool] = True


class JumpTypeAllowedRoleResponse(BaseModel):
    """Response model for jump type allowed role information"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    role: UserRole
    created_at: datetime


class JumpTypeMinimal(BaseModel):
    """Minimal jump type model for references"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    short_name: str


class AdditionalStaffResponse(BaseModel):
    """Response model for additional staff information"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    staff_required_role: UserRole
    staff_default_jump_type_id: Optional[int] = None
    staff_default_jump_type: Optional[JumpTypeMinimal] = None
    created_at: datetime


# =============================================================================
# JUMP TYPE REQUEST/RESPONSE SCHEMAS
# =============================================================================

class JumpTypeCreate(JumpTypeBase):
    """Schema for creating a new jump type"""
    allowed_roles: Optional[List[UserRole]] = None
    additional_staff: Optional[List[dict]] = None  # [{"staff_required_role": UserRole, "staff_default_jump_type_id": int}]


class JumpTypeUpdate(BaseModel):
    """Schema for updating jump type information (all fields optional)"""
    name: Optional[str] = None
    short_name: Optional[str] = None
    description: Optional[str] = None
    exit_altitude: Optional[int] = None
    price: Optional[int] = None
    is_available: Optional[bool] = None
    allowed_roles: Optional[List[UserRole]] = None
    additional_staff: Optional[List[dict]] = None


class JumpTypeResponse(JumpTypeBase):
    """Full jump type response with all details"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    allowed_roles: List[JumpTypeAllowedRoleResponse] = []
    additional_staff: List[AdditionalStaffResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

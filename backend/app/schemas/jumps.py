from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# =============================================================================
# MINIMAL REFERENCE SCHEMAS
# =============================================================================

class UserMinimal(BaseModel):
    """Minimal user model for references"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    first_name: str
    last_name: str
    display_name: Optional[str] = None


class LoadMinimal(BaseModel):
    """Minimal load model for references"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    departure: datetime


class AdditionalStaffMinimal(BaseModel):
    """Minimal additional staff model for references"""
    model_config = ConfigDict(from_attributes=True)
    
    staff_required_role: str
    staff_default_jump_type_id: Optional[int] = None


class JumpTypeMinimal(BaseModel):
    """Minimal jump type model for references"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    short_name: str
    additional_staff: List[AdditionalStaffMinimal] = []


# =============================================================================
# JUMP CORE SCHEMAS
# =============================================================================

class JumpBase(BaseModel):
    """Base jump model with common fields"""
    user_id: int
    jump_type_id: int
    comment: Optional[str] = None
    parent_jump_id: Optional[int] = None


class JumpCreate(JumpBase):
    """Schema for creating a new jump"""
    pass


class JumpUpdate(BaseModel):
    """Schema for updating jump information (all fields optional)"""
    user_id: Optional[int] = None
    jump_type_id: Optional[int] = None
    is_manifested: Optional[bool] = None
    reserved: Optional[bool] = None
    comment: Optional[str] = None
    parent_jump_id: Optional[int] = None


class JumpMinimal(BaseModel):
    """Minimal jump model for references to avoid recursion"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_manifested: bool
    load_id: Optional[int] = None
    reserved: bool = False
    user: Optional[UserMinimal] = None
    jump_type: Optional[JumpTypeMinimal] = None
    comment: Optional[str] = None
    created_at: datetime


class JumpResponse(JumpBase):
    """Full jump response with all details - uses minimal refs to avoid recursion"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_manifested: bool
    load_id: Optional[int] = None
    reserved: bool = False
    user: Optional[UserMinimal] = None
    jump_type: Optional[JumpTypeMinimal] = None
    load: Optional[LoadMinimal] = None
    parent_jump: Optional[JumpMinimal] = None
    child_jumps: List[JumpMinimal] = []
    created_at: datetime
    updated_at: Optional[datetime] = None


# =============================================================================
# LOAD MANAGEMENT SCHEMAS
# =============================================================================

class JumpLoadAssignment(BaseModel):
    """Schema for assigning jump to load"""
    jump_id: int
    reserved: bool = False
    staff_assignments: Optional[dict[str, int]] = None  # role -> user_id mapping


class JumpLoadAssignmentResponse(BaseModel):
    """Response for load assignment operations"""
    success: bool
    message: str
    warning: Optional[str] = None
    assigned_jump_ids: List[int] = []


class JumpLoadRemovalResponse(BaseModel):
    """Response for load removal operations"""
    success: bool
    message: str
    removed_jump_ids: List[int] = []


# Fix forward reference
JumpResponse.model_rebuild()
JumpMinimal.model_rebuild()

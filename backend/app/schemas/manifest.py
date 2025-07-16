from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.enums import LoadStatus, UserRole


# =============================================================================
# MANIFEST SCHEMAS
# =============================================================================

class LoadSummary(BaseModel):
    """Schema for load summary in manifest data"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    index_number: int  # Index within the day (1, 2, 3, etc.)
    aircraft_name: str
    aircraft_id: int
    total_spaces: int
    remaining_public_spaces: int
    remaining_reserved_spaces: int
    departure: datetime
    status: LoadStatus
    reserved_spaces: int


class AdditionalStaffSummary(BaseModel):
    """Minimal additional staff info for manifest"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    staff_required_role: UserRole
    staff_default_jump_type_id: Optional[int] = None


class JumpTypeSummary(BaseModel):
    """Jump type summary with additional staff for manifest"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    short_name: str
    additional_staff: List[AdditionalStaffSummary] = []


class JumpSummary(BaseModel):
    """Schema for jump summary in manifest data"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    user_name: str
    jump_type_name: str
    reserved: bool
    parent_jump_id: Optional[int] = None
    load_id: Optional[int] = None
    staff_assignments: Optional[dict] = None
    jump_type: Optional[JumpTypeSummary] = None


class ManifestResponse(BaseModel):
    """Complete manifest data response"""
    model_config = ConfigDict(from_attributes=True)
    
    loads: List[LoadSummary]
    selected_load: Optional[int] = None
    selected_load_jumps: List[JumpSummary] = []
    unassigned_jumps: List[JumpSummary]

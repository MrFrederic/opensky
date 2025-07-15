from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.enums import LoadStatus


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


class ManifestResponse(BaseModel):
    """Complete manifest data response"""
    model_config = ConfigDict(from_attributes=True)
    
    loads: List[LoadSummary]
    selected_load: Optional[int] = None
    selected_load_jumps: List[JumpSummary] = []
    unassigned_jumps: List[JumpSummary]

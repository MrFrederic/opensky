from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.enums import LoadStatus


# =============================================================================
# LOAD CORE SCHEMAS
# =============================================================================

class LoadBase(BaseModel):
    """Base load model with common fields"""
    departure: datetime
    aircraft_id: int


class AircraftMinimal(BaseModel):
    """Minimal aircraft model for references"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    type: str
    max_load: int


# =============================================================================
# LOAD REQUEST/RESPONSE SCHEMAS
# =============================================================================

class LoadCreate(LoadBase):
    """Schema for creating a new load"""
    pass


class LoadUpdate(BaseModel):
    """Schema for updating load information (all fields optional)"""
    departure: Optional[datetime] = None
    aircraft_id: Optional[int] = None


class LoadStatusUpdate(BaseModel):
    """Schema for updating load status"""
    status: LoadStatus


class LoadReservedSpacesUpdate(BaseModel):
    """Schema for updating reserved spaces"""
    reserved_spaces: int


class LoadSpacesResponse(BaseModel):
    """Schema for spaces information response"""
    model_config = ConfigDict(from_attributes=True)
    
    load_id: int
    total_spaces: int
    reserved_spaces: int
    available_spaces: int


class LoadResponse(LoadBase):
    """Full load response with all details"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    status: LoadStatus
    reserved_spaces: int
    aircraft: Optional[AircraftMinimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

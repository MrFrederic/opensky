from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.enums import AircraftType


# =============================================================================
# AIRCRAFT CORE SCHEMAS
# =============================================================================

class AircraftBase(BaseModel):
    """Base aircraft model with common fields"""
    name: str
    type: AircraftType
    max_load: int


# =============================================================================
# AIRCRAFT REQUEST/RESPONSE SCHEMAS
# =============================================================================

class AircraftCreate(AircraftBase):
    """Schema for creating a new aircraft"""
    pass


class AircraftUpdate(BaseModel):
    """Schema for updating aircraft information (all fields optional)"""
    name: Optional[str] = None
    type: Optional[AircraftType] = None
    max_load: Optional[int] = None


class AircraftResponse(AircraftBase):
    """Full aircraft response with all details"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

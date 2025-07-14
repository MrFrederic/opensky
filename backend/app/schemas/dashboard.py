from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.enums import LoadStatus


class DashboardJump(BaseModel):
    """Jump information for dashboard - limited public data"""
    jump_id: int
    display_name: str
    jump_type_short_name: Optional[str] = None
    parent_jump_id: Optional[int] = None


class DashboardResponse(BaseModel):
    """Load information for public dashboard - limited data"""
    load_id: int
    aircraft_name: Optional[str] = None
    departure: datetime
    remaining_public_slots: int
    status: LoadStatus
    jumps: List[DashboardJump] = []

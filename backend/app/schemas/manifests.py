from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.base import ManifestStatus
from .users import UserSummary
from .equipment import EquipmentSummary
from .dictionaries import DictionaryValueResponse


class ManifestBase(BaseModel):
    jump_type_id: int
    equipment_ids: List[int] = []


class ManifestCreate(ManifestBase):
    tandem_booking_id: Optional[int] = None


class ManifestUpdate(BaseModel):
    jump_type_id: Optional[int] = None
    equipment_ids: Optional[List[int]] = None
    status: Optional[ManifestStatus] = None
    decline_reason: Optional[str] = None


class ManifestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    jump_type_id: int
    status: ManifestStatus
    decline_reason: Optional[str] = None
    tandem_booking_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: Optional[UserSummary] = None
    jump_type: Optional[DictionaryValueResponse] = None
    equipment: List[EquipmentSummary] = []


class ManifestApproval(BaseModel):
    load_id: int


class ManifestDecline(BaseModel):
    reason: str

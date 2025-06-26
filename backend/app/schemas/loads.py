from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .users import UserSummary
from .equipment import EquipmentSummary
from .dictionaries import DictionaryValueResponse


class LoadBase(BaseModel):
    load_date: datetime
    status_id: int


class LoadCreate(LoadBase):
    pass


class LoadUpdate(BaseModel):
    load_date: Optional[datetime] = None
    status_id: Optional[int] = None


class LoadResponse(LoadBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    status: Optional[DictionaryValueResponse] = None


class JumpBase(BaseModel):
    user_id: int
    load_id: int
    jump_type_id: int
    payment_status_id: int
    equipment_ids: List[int] = []
    passenger_id: Optional[int] = None  # For tandem jumps
    comment: Optional[str] = None


class JumpCreate(JumpBase):
    manifest_id: Optional[int] = None


class JumpUpdate(BaseModel):
    user_id: Optional[int] = None
    passenger_id: Optional[int] = None
    load_id: Optional[int] = None
    jump_type_id: Optional[int] = None
    payment_status_id: Optional[int] = None
    equipment_ids: Optional[List[int]] = None
    comment: Optional[str] = None


class JumpResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    passenger_id: Optional[int] = None
    load_id: int
    jump_type_id: int
    payment_status_id: int
    manifest_id: Optional[int] = None
    comment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: Optional[UserSummary] = None
    passenger: Optional[UserSummary] = None
    jump_type: Optional[DictionaryValueResponse] = None
    payment_status: Optional[DictionaryValueResponse] = None
    equipment: List[EquipmentSummary] = []

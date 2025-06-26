from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .dictionaries import DictionaryValueResponse


class EquipmentBase(BaseModel):
    type_id: int
    name_id: int
    serial_number: str
    status_id: int


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    type_id: Optional[int] = None
    name_id: Optional[int] = None
    serial_number: Optional[str] = None
    status_id: Optional[int] = None


class EquipmentResponse(EquipmentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    type: Optional[DictionaryValueResponse] = None
    name: Optional[DictionaryValueResponse] = None
    status: Optional[DictionaryValueResponse] = None


class EquipmentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    serial_number: str
    type: Optional[DictionaryValueResponse] = None
    name: Optional[DictionaryValueResponse] = None
    status: Optional[DictionaryValueResponse] = None

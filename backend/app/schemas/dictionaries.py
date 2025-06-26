from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class DictionaryValueBase(BaseModel):
    value: str
    is_system: bool = False
    is_active: bool = True


class DictionaryValueCreate(DictionaryValueBase):
    dictionary_id: int


class DictionaryValueUpdate(BaseModel):
    value: Optional[str] = None
    is_active: Optional[bool] = None


class DictionaryValueResponse(DictionaryValueBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    dictionary_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class DictionaryBase(BaseModel):
    name: str
    is_active: bool = True


class DictionaryCreate(DictionaryBase):
    pass


class DictionaryUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class DictionaryResponse(DictionaryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    values: List[DictionaryValueResponse] = []

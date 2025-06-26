from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from app.models.base import TandemBookingStatus


class TandemSlotBase(BaseModel):
    slot_date: date
    total_slots: int


class TandemSlotCreate(TandemSlotBase):
    pass


class TandemSlotUpdate(BaseModel):
    total_slots: Optional[int] = None


class TandemSlotResponse(TandemSlotBase):
    model_config = ConfigDict(from_attributes=True)
    
    created_at: datetime
    updated_at: Optional[datetime] = None


class TandemSlotAvailability(BaseModel):
    slot_date: date
    total_slots: int
    booked_slots: int
    available_slots: int


class TandemBookingBase(BaseModel):
    booking_date: date


class TandemBookingCreate(TandemBookingBase):
    pass


class TandemBookingUpdate(BaseModel):
    booking_date: Optional[date] = None
    status: Optional[TandemBookingStatus] = None


class TandemBookingResponse(TandemBookingBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    status: TandemBookingStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

from sqlalchemy import Column, Integer, Date, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from .base import User, TandemBookingStatus


class TandemSlot(Base):
    __tablename__ = "tandem_slots"
    
    slot_date = Column(Date, primary_key=True)
    total_slots = Column(Integer, nullable=False, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)


class TandemBooking(Base):
    __tablename__ = "tandem_bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    booking_date = Column(Date, nullable=False)
    status = Column(Enum(TandemBookingStatus), default=TandemBookingStatus.CONFIRMED)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="tandem_bookings")
    manifests = relationship("Manifest", back_populates="tandem_booking")

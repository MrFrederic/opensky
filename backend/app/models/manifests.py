from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from .base import User, DictionaryValue, ManifestStatus
from .equipment import manifest_equipment


class Manifest(Base):
    __tablename__ = "manifests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    jump_type_id = Column(Integer, ForeignKey("dictionary_values.id"), nullable=False)
    status = Column(Enum(ManifestStatus), default=ManifestStatus.PENDING)
    decline_reason = Column(Text, nullable=True)
    tandem_booking_id = Column(Integer, ForeignKey("tandem_bookings.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="manifests")
    jump_type = relationship("DictionaryValue", foreign_keys=[jump_type_id])
    equipment = relationship("Equipment", secondary=manifest_equipment, back_populates="manifests")
    tandem_booking = relationship("TandemBooking", back_populates="manifests")
    jump = relationship("Jump", back_populates="manifest", uselist=False)

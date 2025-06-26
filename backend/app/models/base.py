from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UserStatus(str, enum.Enum):
    NEWBY = "newby"
    INDIVIDUAL_SPORTSMAN = "individual_sportsman"
    SPORTSMAN = "sportsman"
    INSTRUCTOR = "instructor"


class ManifestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DECLINED = "declined"


class TandemBookingStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=True)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(Enum(UserStatus), default=UserStatus.NEWBY)
    is_admin = Column(Boolean, default=False)
    license_document_url = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    manifests = relationship("Manifest", foreign_keys="Manifest.user_id", back_populates="user")
    jumps = relationship("Jump", foreign_keys="Jump.user_id", back_populates="user")
    tandem_jumps = relationship("Jump", foreign_keys="Jump.passenger_id", back_populates="passenger")
    tandem_bookings = relationship("TandemBooking", foreign_keys="TandemBooking.user_id", back_populates="user")


class Dictionary(Base):
    __tablename__ = "dictionaries"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    values = relationship("DictionaryValue", back_populates="dictionary")


class DictionaryValue(Base):
    __tablename__ = "dictionary_values"
    
    id = Column(Integer, primary_key=True, index=True)
    dictionary_id = Column(Integer, ForeignKey("dictionaries.id"), nullable=False)
    value = Column(String, nullable=False)
    is_system = Column(Boolean, default=False)  # Prevents deletion of system values
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    dictionary = relationship("Dictionary", back_populates="values")

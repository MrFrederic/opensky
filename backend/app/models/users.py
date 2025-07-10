from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import UserRole  # Import enum from new enums.py

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=True)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, nullable=True)
    license_document_url = Column(Text, nullable=True)
    avatar_url = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    roles = relationship("UserRoleAssignment", foreign_keys="UserRoleAssignment.user_id", back_populates="user", cascade="all, delete-orphan")
    manifests = relationship("Manifest", foreign_keys="Manifest.user_id", back_populates="user")
    jumps = relationship("Jump", foreign_keys="Jump.user_id", back_populates="user")
    tandem_jumps = relationship("Jump", foreign_keys="Jump.passenger_id", back_populates="passenger")
    tandem_bookings = relationship("TandemBooking", foreign_keys="TandemBooking.user_id", back_populates="user")


class UserRoleAssignment(Base):
    __tablename__ = "user_roles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    role = Column(Enum(UserRole), nullable=False)  # Enum import moved to enums.py
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="roles")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'role', name='uq_user_role'),
    )

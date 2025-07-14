from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import UserRole


class JumpType(Base):
    __tablename__ = "jump_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    short_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    exit_altitude = Column(Integer, nullable=True)
    price = Column(Integer, nullable=True)
    is_available = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    deleted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    allowed_roles = relationship("JumpTypeAllowedRole", foreign_keys="JumpTypeAllowedRole.jump_type_id", back_populates="jump_type", cascade="all, delete-orphan")
    additional_staff = relationship("AdditionalStaff", foreign_keys="AdditionalStaff.jump_type_id", back_populates="jump_type", cascade="all, delete-orphan")
    jumps = relationship("Jump", foreign_keys="Jump.jump_type_id", back_populates="jump_type")


class JumpTypeAllowedRole(Base):
    __tablename__ = "jump_type_allowed_roles"
    
    id = Column(Integer, primary_key=True, index=True)
    jump_type_id = Column(Integer, ForeignKey('jump_types.id'), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relationships
    jump_type = relationship("JumpType", foreign_keys=[jump_type_id], back_populates="allowed_roles")
    
    __table_args__ = (
        UniqueConstraint('jump_type_id', 'role', name='uq_jump_type_role'),
    )


class AdditionalStaff(Base):
    __tablename__ = "additional_staff"
    
    id = Column(Integer, primary_key=True, index=True)
    jump_type_id = Column(Integer, ForeignKey('jump_types.id'), nullable=False)
    staff_required_role = Column(Enum(UserRole), nullable=False)
    staff_default_jump_type_id = Column(Integer, ForeignKey('jump_types.id'), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relationships
    jump_type = relationship("JumpType", foreign_keys=[jump_type_id], back_populates="additional_staff")
    staff_default_jump_type = relationship("JumpType", foreign_keys=[staff_default_jump_type_id])

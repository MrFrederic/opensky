from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Jump(Base):
    __tablename__ = "jumps"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    jump_type_id = Column(Integer, ForeignKey('jump_types.id'), nullable=False)
    is_manifested = Column(Boolean, default=False, nullable=False)
    load_id = Column(Integer, ForeignKey('loads.id'), nullable=True)
    reserved = Column(Boolean, default=False, nullable=False)
    comment = Column(Text, nullable=True)
    parent_jump_id = Column(Integer, ForeignKey('jumps.id'), nullable=True)
    jump_date = Column(DateTime(timezone=True), nullable=True)  # DateTime when jump was performed
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    jump_type = relationship("JumpType", foreign_keys=[jump_type_id])
    load = relationship("Load", foreign_keys=[load_id])
    parent_jump = relationship("Jump", foreign_keys=[parent_jump_id], remote_side=[id], back_populates="child_jumps")
    child_jumps = relationship("Jump", foreign_keys=[parent_jump_id], back_populates="parent_jump")
    
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

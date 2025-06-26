from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from .base import User, DictionaryValue
from .equipment import jump_equipment


class Load(Base):
    __tablename__ = "loads"
    
    id = Column(Integer, primary_key=True, index=True)
    load_date = Column(DateTime, nullable=False)
    status_id = Column(Integer, ForeignKey("dictionary_values.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    status = relationship("DictionaryValue", foreign_keys=[status_id])
    jumps = relationship("Jump", back_populates="load")


class Jump(Base):
    __tablename__ = "jumps"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    passenger_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # For tandem jumps
    load_id = Column(Integer, ForeignKey("loads.id"), nullable=False)
    jump_type_id = Column(Integer, ForeignKey("dictionary_values.id"), nullable=False)
    payment_status_id = Column(Integer, ForeignKey("dictionary_values.id"), nullable=False)
    manifest_id = Column(Integer, ForeignKey("manifests.id"), nullable=True)
    comment = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="jumps")
    passenger = relationship("User", foreign_keys=[passenger_id], back_populates="tandem_jumps")
    load = relationship("Load", back_populates="jumps")
    jump_type = relationship("DictionaryValue", foreign_keys=[jump_type_id])
    payment_status = relationship("DictionaryValue", foreign_keys=[payment_status_id])
    equipment = relationship("Equipment", secondary=jump_equipment, back_populates="jumps")
    manifest = relationship("Manifest", back_populates="jump")

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from .base import User, DictionaryValue

# Many-to-many association table for equipment and jumps
jump_equipment = Table(
    'jump_equipment',
    Base.metadata,
    Column('jump_id', Integer, ForeignKey('jumps.id'), primary_key=True),
    Column('equipment_id', Integer, ForeignKey('equipment.id'), primary_key=True)
)

# Many-to-many association table for equipment and manifests
manifest_equipment = Table(
    'manifest_equipment',
    Base.metadata,
    Column('manifest_id', Integer, ForeignKey('manifests.id'), primary_key=True),
    Column('equipment_id', Integer, ForeignKey('equipment.id'), primary_key=True)
)


class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    type_id = Column(Integer, ForeignKey("dictionary_values.id"), nullable=False)
    name_id = Column(Integer, ForeignKey("dictionary_values.id"), nullable=False)
    serial_number = Column(String, nullable=False)
    status_id = Column(Integer, ForeignKey("dictionary_values.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    type = relationship("DictionaryValue", foreign_keys=[type_id])
    name = relationship("DictionaryValue", foreign_keys=[name_id])
    status = relationship("DictionaryValue", foreign_keys=[status_id])
    jumps = relationship("Jump", secondary=jump_equipment, back_populates="equipment")
    manifests = relationship("Manifest", secondary=manifest_equipment, back_populates="equipment")

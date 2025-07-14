from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import LoadStatus


class Load(Base):
    __tablename__ = "loads"
    
    id = Column(Integer, primary_key=True, index=True)
    departure = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(LoadStatus), nullable=False, default=LoadStatus.FORMING)
    aircraft_id = Column(Integer, ForeignKey('aircraft.id'), nullable=False)
    reserved_spaces = Column(Integer, nullable=False, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    aircraft = relationship("Aircraft", back_populates="loads")
    jumps = relationship("Jump", foreign_keys="Jump.load_id", back_populates="load")
    
    # Check constraint to ensure reserved_spaces is not negative
    __table_args__ = (
        CheckConstraint('reserved_spaces >= 0', name='reserved_spaces_non_negative'),
    )

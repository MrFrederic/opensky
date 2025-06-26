from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.equipment import Equipment
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate


class CRUDEquipment(CRUDBase[Equipment, EquipmentCreate, EquipmentUpdate]):
    def get_by_type(self, db: Session, *, type_id: int, skip: int = 0, limit: int = 100) -> List[Equipment]:
        """Get equipment by type"""
        return (
            db.query(Equipment)
            .filter(Equipment.type_id == type_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_status(self, db: Session, *, status_id: int, skip: int = 0, limit: int = 100) -> List[Equipment]:
        """Get equipment by status"""
        return (
            db.query(Equipment)
            .filter(Equipment.status_id == status_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_available(self, db: Session, *, available_status_id: int, skip: int = 0, limit: int = 100) -> List[Equipment]:
        """Get available equipment"""
        return self.get_by_status(db, status_id=available_status_id, skip=skip, limit=limit)

    def get_by_serial_number(self, db: Session, *, serial_number: str) -> Optional[Equipment]:
        """Get equipment by serial number"""
        return db.query(Equipment).filter(Equipment.serial_number == serial_number).first()


equipment = CRUDEquipment(Equipment)

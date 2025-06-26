from typing import List, Optional
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.crud.base import CRUDBase
from app.models.loads import Load, Jump
from app.schemas.loads import LoadCreate, LoadUpdate, JumpCreate, JumpUpdate


class CRUDLoad(CRUDBase[Load, LoadCreate, LoadUpdate]):
    def get_by_date_range(self, db: Session, *, start_date: date, end_date: date) -> List[Load]:
        """Get loads within a date range"""
        return (
            db.query(Load)
            .filter(
                and_(
                    func.date(Load.load_date) >= start_date,
                    func.date(Load.load_date) <= end_date
                )
            )
            .order_by(Load.load_date.asc())
            .all()
        )

    def get_by_date(self, db: Session, *, load_date: date) -> List[Load]:
        """Get all loads for a specific date"""
        return (
            db.query(Load)
            .filter(func.date(Load.load_date) == load_date)
            .order_by(Load.load_date.asc())
            .all()
        )


class CRUDJump(CRUDBase[Jump, JumpCreate, JumpUpdate]):
    def get_by_user(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[Jump]:
        """Get jumps by user (for logbook)"""
        return (
            db.query(Jump)
            .filter(Jump.user_id == user_id)
            .order_by(Jump.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_load(self, db: Session, *, load_id: int) -> List[Jump]:
        """Get all jumps in a load"""
        return (
            db.query(Jump)
            .filter(Jump.load_id == load_id)
            .order_by(Jump.created_at.asc())
            .all()
        )

    def get_user_jump_stats(self, db: Session, *, user_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None) -> dict:
        """Get jump statistics for a user"""
        query = db.query(Jump).filter(Jump.user_id == user_id)
        
        if start_date:
            query = query.filter(func.date(Jump.created_at) >= start_date)
        if end_date:
            query = query.filter(func.date(Jump.created_at) <= end_date)
        
        jumps = query.all()
        
        # Count by jump type
        stats = {
            'total_jumps': len(jumps),
            'by_type': {},
            'by_payment_status': {}
        }
        
        for jump in jumps:
            # Count by jump type
            jump_type = jump.jump_type.value if jump.jump_type else 'Unknown'
            stats['by_type'][jump_type] = stats['by_type'].get(jump_type, 0) + 1
            
            # Count by payment status
            payment_status = jump.payment_status.value if jump.payment_status else 'Unknown'
            stats['by_payment_status'][payment_status] = stats['by_payment_status'].get(payment_status, 0) + 1
        
        return stats

    def create_with_equipment(self, db: Session, *, obj_in: JumpCreate, created_by: Optional[int] = None) -> Jump:
        """Create jump with equipment associations"""
        from app.crud.equipment import equipment as equipment_crud
        
        # Create jump without equipment first
        jump_data = obj_in.dict(exclude={'equipment_ids'})
        if created_by:
            jump_data['created_by'] = created_by
            
        jump = Jump(**jump_data)
        db.add(jump)
        db.flush()  # Flush to get the ID
        
        # Add equipment associations
        if obj_in.equipment_ids:
            for equipment_id in obj_in.equipment_ids:
                equipment_obj = equipment_crud.get(db, id=equipment_id)
                if equipment_obj:
                    jump.equipment.append(equipment_obj)
        
        db.commit()
        db.refresh(jump)
        return jump

    def create_from_manifest(self, db: Session, *, manifest_id: int, load_id: int, created_by: Optional[int] = None) -> Jump:
        """Create a jump from an approved manifest"""
        from app.crud.manifests import manifest as manifest_crud
        
        manifest = manifest_crud.get(db, id=manifest_id)
        if not manifest:
            raise ValueError("Manifest not found")
        
        # Create jump data from manifest
        jump_data = {
            'user_id': manifest.user_id,
            'load_id': load_id,
            'jump_type_id': manifest.jump_type_id,
            'manifest_id': manifest_id,
            'payment_status_id': 1,  # Default payment status - should be configurable
        }
        
        if manifest.tandem_booking:
            jump_data['passenger_id'] = manifest.tandem_booking.user_id
        
        if created_by:
            jump_data['created_by'] = created_by
            
        jump = Jump(**jump_data)
        db.add(jump)
        db.flush()
        
        # Copy equipment from manifest
        for equipment in manifest.equipment:
            jump.equipment.append(equipment)
        
        db.commit()
        db.refresh(jump)
        return jump


load = CRUDLoad(Load)
jump = CRUDJump(Jump)

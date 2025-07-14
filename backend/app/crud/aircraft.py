from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from app.crud.base import CRUDBase
from app.models.aircraft import Aircraft
from app.models.enums import AircraftType
from app.schemas.aircraft import AircraftCreate, AircraftUpdate
import logging

logger = logging.getLogger(__name__)


class CRUDAircraft(CRUDBase[Aircraft, AircraftCreate, AircraftUpdate]):
    def get_aircraft(
        self,
        db: Session,
        *,
        filters: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False
    ) -> List[Aircraft]:
        """Get aircraft with flexible filters - supports combining multiple parameters"""
        query = db.query(Aircraft)
        
        # Exclude soft-deleted records by default
        if not include_deleted:
            query = query.filter(Aircraft.deleted_at.is_(None))
        
        if not filters:
            return query.offset(skip).limit(limit).all()

        # Apply search across name
        if filters.get('search'):
            search_pattern = f"%{filters['search'].lower()}%"
            query = query.filter(Aircraft.name.ilike(search_pattern))

        # Apply type filter
        if filters.get('type'):
            query = query.filter(Aircraft.type == filters['type'])

        # Apply exact field filters
        for field in ['id']:
            if filters.get(field) is not None:
                query = query.filter(getattr(Aircraft, field) == filters[field])

        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: AircraftCreate, created_by: Optional[int] = None) -> Aircraft:
        """Create a new aircraft"""
        obj_in_data = obj_in.model_dump()
        if created_by is not None:
            obj_in_data['created_by'] = created_by
        
        db_obj = Aircraft(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Aircraft, obj_in: AircraftUpdate, updated_by: Optional[int] = None) -> Aircraft:
        """Update aircraft"""
        update_data = obj_in.model_dump(exclude_unset=True)
        
        if update_data:
            if updated_by is not None:
                update_data['updated_by'] = updated_by
            db_obj = super().update(db, db_obj=db_obj, obj_in=update_data)
        
        return db_obj

    def has_linked_objects(self, db: Session, *, aircraft_id: int) -> bool:
        """Check if aircraft has linked loads"""
        from app.models.loads import Load
        
        # Count linked loads instead of just checking for existence
        linked_loads_count = db.query(Load).filter(Load.aircraft_id == aircraft_id).count()
        return linked_loads_count > 0

    def remove(self, db: Session, *, id: int, deleted_by: Optional[int] = None) -> Aircraft:
        """Delete aircraft - use soft delete if linked objects exist, hard delete otherwise"""
        aircraft = self.get(db, id=id, include_deleted=False)
        if not aircraft:
            raise HTTPException(status_code=404, detail="Aircraft not found")
        
        # Check for linked objects FIRST, before any deletion attempt
        has_links = self.has_linked_objects(db, aircraft_id=id)
        
        if has_links:
            # Soft delete if there are linked objects
            result = self.soft_delete(db, id=id, deleted_by=deleted_by)
            if result:
                return result  # Return the soft-deleted object for consistency
            else:
                raise HTTPException(status_code=500, detail="Failed to soft delete aircraft")
        else:
            # Hard delete if no linked objects
            try:
                return super().remove(db, id=id)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to delete aircraft: {str(e)}")


aircraft = CRUDAircraft(Aircraft)

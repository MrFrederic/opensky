from typing import List, Optional, Dict, Any
from datetime import datetime, date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from fastapi import HTTPException, status
from app.crud.base import CRUDBase
from app.models.loads import Load
from app.models.aircraft import Aircraft
from app.models.enums import LoadStatus
from app.schemas.loads import LoadCreate, LoadUpdate
import logging

logger = logging.getLogger(__name__)


class CRUDLoad(CRUDBase[Load, LoadCreate, LoadUpdate]):
    def get(self, db: Session, id: int) -> Optional[Load]:
        """Get load by id with aircraft loaded"""
        return (
            db.query(Load)
            .options(joinedload(Load.aircraft))
            .filter(Load.id == id)
            .first()
        )

    def get_loads(
        self,
        db: Session,
        *,
        filters: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Load]:
        """Get loads with flexible filters - supports combining multiple parameters. By default, returns only today's loads unless a date range is specified."""
        query = db.query(Load).options(joinedload(Load.aircraft))
        
        # If no filters or no date range in filters, default to today's loads
        if not filters or (not filters.get('departure_from') and not filters.get('departure_to')):
            today = date.today()
            start_of_day = datetime.combine(today, datetime.min.time())
            end_of_day = datetime.combine(today, datetime.max.time())
            query = query.filter(
                and_(
                    Load.departure >= start_of_day,
                    Load.departure <= end_of_day
                )
            )
        else:
            # Apply departure date range filter if specified
            if filters.get('departure_from') and filters.get('departure_to'):
                departure_from = filters['departure_from']
                departure_to = filters['departure_to']
                query = query.filter(
                    and_(
                        Load.departure >= departure_from,
                        Load.departure <= departure_to
                    )
                )
            elif filters.get('departure_from'):
                query = query.filter(Load.departure >= filters['departure_from'])
            elif filters.get('departure_to'):
                query = query.filter(Load.departure <= filters['departure_to'])

        # Apply aircraft filter
        if filters and filters.get('aircraft_id'):
            query = query.filter(Load.aircraft_id == filters['aircraft_id'])

        # Apply exact field filters
        if filters:
            for field in ['id', 'status']:
                if filters.get(field) is not None:
                    query = query.filter(getattr(Load, field) == filters[field])

        return query.order_by(Load.departure.asc()).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: LoadCreate, created_by: Optional[int] = None) -> Load:
        """Create a new load with default status=forming and reserved_spaces=0"""
        # Verify aircraft exists
        aircraft = db.query(Aircraft).filter(Aircraft.id == obj_in.aircraft_id).first()
        if not aircraft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aircraft not found"
            )
        
        obj_in_data = obj_in.model_dump()
        obj_in_data['status'] = LoadStatus.FORMING
        obj_in_data['reserved_spaces'] = 0
        
        if created_by is not None:
            obj_in_data['created_by'] = created_by
        
        db_obj = Load(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Load, obj_in: LoadUpdate, updated_by: Optional[int] = None) -> Load:
        """Update load basic information (excludes status and reserved_spaces)"""
        update_data = obj_in.model_dump(exclude_unset=True)
        
        # Verify aircraft exists if being updated
        if 'aircraft_id' in update_data:
            aircraft = db.query(Aircraft).filter(Aircraft.id == update_data['aircraft_id']).first()
            if not aircraft:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Aircraft not found"
                )
        
        if update_data:
            if updated_by is not None:
                update_data['updated_by'] = updated_by
            db_obj = super().update(db, db_obj=db_obj, obj_in=update_data)
        
        return db_obj

    def update_status(self, db: Session, *, db_obj: Load, new_status: LoadStatus, updated_by: Optional[int] = None) -> Load:
        """Update load status"""
        update_data = {'status': new_status}
        if updated_by is not None:
            update_data['updated_by'] = updated_by
        
        db_obj = super().update(db, db_obj=db_obj, obj_in=update_data)
        return db_obj

    def update_reserved_spaces(self, db: Session, *, db_obj: Load, reserved_spaces: int, updated_by: Optional[int] = None) -> Load:
        """Update load reserved spaces with validation"""
        # Load aircraft to get max_load for validation
        if not db_obj.aircraft:
            db_obj = self.get(db, id=db_obj.id)
        
        if reserved_spaces < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reserved spaces cannot be negative"
            )
        
        if reserved_spaces > db_obj.aircraft.max_load:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Reserved spaces ({reserved_spaces}) cannot exceed aircraft max load ({db_obj.aircraft.max_load})"
            )
        
        update_data = {'reserved_spaces': reserved_spaces}
        if updated_by is not None:
            update_data['updated_by'] = updated_by
        
        db_obj = super().update(db, db_obj=db_obj, obj_in=update_data)
        return db_obj

    def get_spaces_info(self, load: Load) -> dict:
        """Get spaces information for a load"""
        return {
            "load_id": load.id,
            "total_spaces": load.aircraft.max_load,
            "reserved_spaces": load.reserved_spaces,
            "available_spaces": load.aircraft.max_load - load.reserved_spaces
        }


load = CRUDLoad(Load)

from typing import List, Optional, Dict, Any
import logging
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from fastapi import HTTPException, status
from app.crud.base import CRUDBase
from app.models.jumps import Jump
from app.models.users import User
from app.models.jump_types import JumpType, AdditionalStaff
from app.models.loads import Load
from app.models.aircraft import Aircraft
from app.models.enums import LoadStatus
from app.schemas.jumps import JumpCreate, JumpUpdate
import logging

logger = logging.getLogger(__name__)


class CRUDJump(CRUDBase[Jump, JumpCreate, JumpUpdate]):
    def get(self, db: Session, id: int) -> Optional[Jump]:
        """Get jump by id with all relationships loaded"""
        return (
            db.query(Jump)
            .options(
                joinedload(Jump.user),
                joinedload(Jump.jump_type).joinedload(JumpType.additional_staff),
                joinedload(Jump.load),
                joinedload(Jump.parent_jump),
                joinedload(Jump.child_jumps)
            )
            .filter(Jump.id == id)
            .first()
        )

    def get_jumps(
        self,
        db: Session,
        *,
        filters: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Jump]:
        """Get jumps with flexible filters"""
        query = (
            db.query(Jump)
            .options(
                joinedload(Jump.user),
                joinedload(Jump.jump_type).joinedload(JumpType.additional_staff),
                joinedload(Jump.load),
                joinedload(Jump.parent_jump)
            )
        )
        
        if filters:
            # Filter by user
            if filters.get('user_id'):
                query = query.filter(Jump.user_id == filters['user_id'])
            
            # Filter by jump type
            if filters.get('jump_type_id'):
                query = query.filter(Jump.jump_type_id == filters['jump_type_id'])
            
            # Filter by manifested status
            if filters.get('is_manifested') is not None:
                query = query.filter(Jump.is_manifested == filters['is_manifested'])
            
            # Filter by load
            if filters.get('load_id'):
                query = query.filter(Jump.load_id == filters['load_id'])
            
            # Filter by parent jump
            if filters.get('parent_jump_id'):
                query = query.filter(Jump.parent_jump_id == filters['parent_jump_id'])
            
            # Filter by has parent (for finding linked jumps)
            if filters.get('has_parent') is not None:
                if filters['has_parent']:
                    query = query.filter(Jump.parent_jump_id.isnot(None))
                else:
                    query = query.filter(Jump.parent_jump_id.is_(None))
            
            # Filter by has load (for finding unassigned/assigned jumps)
            if filters.get('has_load') is not None:
                if filters['has_load']:
                    query = query.filter(Jump.load_id.isnot(None))
                else:
                    query = query.filter(Jump.load_id.is_(None))
        
        return query.offset(skip).limit(limit).all()

    def create_jump(self, db: Session, *, obj_in: JumpCreate, user_id: int) -> Jump:
        """Create jump with created_by tracking"""
        obj_in_data = obj_in.model_dump()
        obj_in_data["created_by"] = user_id
        db_obj = Jump(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return self.get(db, db_obj.id)

    def update_jump(
        self, db: Session, *, db_obj: Jump, obj_in: JumpUpdate, user_id: int
    ) -> Jump:
        """Update jump with updated_by tracking"""
        obj_data = obj_in.model_dump(exclude_unset=True)
        obj_data["updated_by"] = user_id
        for field, value in obj_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return self.get(db, db_obj.id)

    def assign_to_load(
        self, 
        db: Session, 
        *, 
        jump_id: int, 
        load_id: int, 
        reserved: bool = False,
        staff_assignments: Optional[Dict[str, int]] = None,
        user_id: int
    ) -> Dict[str, Any]:
        """Assign jump to load and create required staff jumps"""
        # Get the jump and validate it exists
        jump = self.get(db, jump_id)
        if not jump:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Jump not found"
            )
        
        # Get the load and validate it exists
        load = db.query(Load).options(joinedload(Load.aircraft)).filter(Load.id == load_id).first()
        if not load:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Load not found"
            )
        
        # Check if jump is already assigned to a load
        #if jump.load_id:
        #    raise HTTPException(
        #        status_code=status.HTTP_400_BAD_REQUEST,
        #        detail="Jump is already assigned to a load"
        #    )
        
        # Check if user already has a jump in this load
        user_in_load = db.query(Jump).filter(Jump.user_id == jump.user_id, Jump.load_id == load_id, Jump.id != jump.id).first()
        if user_in_load:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a jump in this load"
            )
        
        # Get current load occupancy with proper space calculations
        load_jumps = self.get_jumps(db, filters={'load_id': load_id})
        occupied_public_spaces = len([j for j in load_jumps if not j.reserved])
        occupied_reserved_spaces = len([j for j in load_jumps if j.reserved])
        
        total_spaces = load.aircraft.max_load
        remaining_reserved_spaces = load.reserved_spaces - occupied_reserved_spaces
        remaining_public_spaces = total_spaces - load.reserved_spaces - occupied_public_spaces
        
        # Get required additional staff
        additional_staff_required = jump.jump_type.additional_staff
        required_spaces = 1 + len(additional_staff_required)  # main jump + staff
        
        # Check space availability based on reservation type
        warning = None
        if reserved:
            if remaining_reserved_spaces < required_spaces:
                warning = f"Load has only {remaining_reserved_spaces} available reserved spaces but {required_spaces} are needed"
        else:
            if remaining_public_spaces < required_spaces:
                warning = f"Load has only {remaining_public_spaces} available public spaces but {required_spaces} are needed"
        
        # Assign the main jump to the load
        jump.load_id = load_id
        jump.is_manifested = True
        jump.reserved = reserved
        jump.updated_by = user_id
        
        # Set jump_date if load is already departed
        if load.status == LoadStatus.DEPARTED:
            jump.jump_date = load.departure
        
        assigned_jump_ids = [jump_id]
        
        # Create staff jumps if required
        for staff_req in additional_staff_required:
            staff_user_id = None
            if staff_assignments:
                staff_user_id = staff_assignments.get(staff_req.staff_required_role.value)
            
            if not staff_user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Staff user_id required for role: {staff_req.staff_required_role.value}"
                )
            
            # Validate staff user exists
            staff_user = db.query(User).filter(User.id == staff_user_id).first()
            if not staff_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Staff user {staff_user_id} not found"
                )
            # Check if staff user already has a jump in this load
            staff_user_in_load = db.query(Jump).filter(Jump.user_id == staff_user_id, Jump.load_id == load_id).first()
            if staff_user_in_load:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Staff user {staff_user_id} already has a jump in this load"
                )
            # Create staff jump
            staff_jump_type_id = staff_req.staff_default_jump_type_id or jump.jump_type_id
            staff_jump = Jump(
                user_id=staff_user_id,
                jump_type_id=staff_jump_type_id,
                is_manifested=True,
                load_id=load_id,
                reserved=reserved,  # Staff jumps inherit the reservation status
                parent_jump_id=jump_id,
                comment=f"Staff for {jump.user.first_name} {jump.user.last_name}",
                jump_date=load.departure if load.status == LoadStatus.DEPARTED else None,
                created_by=user_id
            )
            db.add(staff_jump)
            db.flush()  # Flush to get the ID
            assigned_jump_ids.append(staff_jump.id)
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Jump assigned to load {load_id}",
            "warning": warning,
            "assigned_jump_ids": assigned_jump_ids
        }

    def remove_from_load(
        self, 
        db: Session, 
        *, 
        jump_id: int, 
        user_id: int
    ) -> Dict[str, Any]:
        """Remove jump from load and delete linked staff jumps"""
        # Get the jump and validate it exists
        jump = self.get(db, jump_id)
        if not jump:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Jump not found"
            )
        
        if not jump.load_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Jump is not assigned to any load"
            )
        
        # Get all child jumps (staff jumps)
        child_jumps = self.get_jumps(db, filters={'parent_jump_id': jump_id})
        removed_jump_ids = [jump_id]
        
        # Remove child jumps first
        for child_jump in child_jumps:
            removed_jump_ids.append(child_jump.id)
            db.delete(child_jump)
        
        # Remove the main jump from load
        jump.load_id = None
        jump.is_manifested = True
        jump.reserved = False  # Unset reserved when removing from load
        jump.jump_date = None  # Clear jump date when removing from load
        jump.updated_by = user_id
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Jump removed from load",
            "removed_jump_ids": removed_jump_ids
        }

    def get_logbook_jumps(
        self,
        db: Session,
        *,
        user_id: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Jump]:
        """Get jumps for logbook with aircraft information and filtering"""
        # Base query with all needed relationships
        query = (
            db.query(Jump)
            .options(
                joinedload(Jump.jump_type),
                joinedload(Jump.load).joinedload(Load.aircraft)
            )
            .filter(Jump.user_id == user_id)
            .filter(Jump.is_manifested == True)  # Only manifested jumps in logbook
            .filter(Jump.jump_date.isnot(None))  # Only jumps with date set
        )
        
        # Apply filters
        if filters:
            # Jump type filters by IDs (multiple)
            if filters.get('jump_type_ids'):
                jump_type_ids = filters['jump_type_ids']
                if jump_type_ids:  # Only apply if list is not empty
                    query = query.filter(Jump.jump_type_id.in_(jump_type_ids))
            
            # Aircraft filters by IDs (multiple)
            if filters.get('aircraft_ids'):
                aircraft_ids = filters['aircraft_ids']
                if aircraft_ids:  # Only apply if list is not empty
                    query = query.filter(
                        Jump.load.has(Load.aircraft_id.in_(aircraft_ids))
                    )
            
            # Jump type filters by names (multiple) - for backward compatibility
            if filters.get('jump_type_names'):
                jump_type_names = filters['jump_type_names']
                if jump_type_names:  # Only apply if list is not empty
                    query = query.filter(
                        Jump.jump_type.has(JumpType.name.in_(jump_type_names))
                    )
            
            # Aircraft filters by names (multiple) - for backward compatibility
            if filters.get('aircraft_names'):
                aircraft_names = filters['aircraft_names']
                if aircraft_names:  # Only apply if list is not empty
                    query = query.filter(
                        Jump.load.has(Load.aircraft.has(Aircraft.name.in_(aircraft_names)))
                    )
            
            # Legacy single filters for backward compatibility
            if filters.get('jump_type_name'):
                query = query.filter(
                    Jump.jump_type.has(JumpType.name == filters['jump_type_name'])
                )
            
            if filters.get('aircraft_name'):
                query = query.filter(
                    Jump.load.has(Load.aircraft.has(Aircraft.name == filters['aircraft_name']))
                )
            
            # Manifestation status filter (though logbook only shows manifested jumps by default)
            if filters.get('is_manifested') is not None:
                query = query.filter(Jump.is_manifested == filters['is_manifested'])
        
        # Order by jump date descending, then created_at descending
        query = query.order_by(Jump.jump_date.desc().nulls_last(), Jump.created_at.desc())

        # Get all results
        jumps = query.all()
        
        return jumps

    def get_load_jumps(self, db: Session, load_id: int) -> List[Jump]:
        """Get all jumps for a specific load"""
        return self.get_jumps(db, filters={'load_id': load_id})


jump = CRUDJump(Jump)

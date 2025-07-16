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
        """Assign jump to load and store staff assignments directly in jump object"""
        # Get and validate jump and load
        jump = self._get_validated_jump(db, jump_id)
        load = self._get_validated_load(db, load_id)
        
        # Validate user constraints for this load
        self._validate_user_constraints(db, jump, load_id)
        
        # Check space availability and get warning if needed
        warning = self._check_space_availability(db, load, jump, reserved)
        
        # Validate staff assignments if required
        self._validate_staff_assignments(db, jump, load_id, reserved, staff_assignments)
        
        # Clean up existing staff jumps if reassigning within same load
        if jump.load_id == load_id:
            self._cleanup_existing_staff_jumps(db, jump_id)
        
        # Assign jump to load
        self._assign_jump_to_load(jump, load, reserved, staff_assignments, user_id)
        
        # Create staff jumps
        assigned_jump_ids = [jump_id]
        assigned_jump_ids.extend(self._create_staff_jumps(db, jump, load, reserved, staff_assignments, user_id))
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Jump assigned to load {load_id}",
            "warning": warning,
            "assigned_jump_ids": assigned_jump_ids
        }

    def _get_validated_jump(self, db: Session, jump_id: int) -> Jump:
        """Get and validate jump exists"""
        jump = self.get(db, jump_id)
        if not jump:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Jump not found"
            )
        return jump

    def _get_validated_load(self, db: Session, load_id: int) -> Load:
        """Get and validate load exists"""
        load = db.query(Load).options(joinedload(Load.aircraft)).filter(Load.id == load_id).first()
        if not load:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Load not found"
            )
        return load

    def _validate_user_constraints(self, db: Session, jump: Jump, load_id: int):
        """Validate user is not already in this load (unless reassigning same jump)"""
        user_in_load = db.query(Jump).filter(
            Jump.user_id == jump.user_id, 
            Jump.load_id == load_id, 
            Jump.id != jump.id
        ).first()
        
        # Only block if this is a different jump from the same user in the same load
        if user_in_load and jump.load_id != load_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a jump in this load"
            )

    def _check_space_availability(self, db: Session, load: Load, jump: Jump, reserved: bool) -> Optional[str]:
        """Check space availability and return warning if needed"""
        load_jumps = self.get_jumps(db, filters={'load_id': load.id})
        occupied_public_spaces = len([j for j in load_jumps if not j.reserved])
        occupied_reserved_spaces = len([j for j in load_jumps if j.reserved])
        
        total_spaces = load.aircraft.max_load
        remaining_reserved_spaces = load.reserved_spaces - occupied_reserved_spaces
        remaining_public_spaces = total_spaces - load.reserved_spaces - occupied_public_spaces
        
        additional_staff_required = jump.jump_type.additional_staff
        required_spaces = 1 + len(additional_staff_required)  # main jump + staff
        
        warning = None
        if reserved:
            if remaining_reserved_spaces < required_spaces:
                warning = f"Load has only {remaining_reserved_spaces} available reserved spaces but {required_spaces} are needed"
        else:
            if remaining_public_spaces < required_spaces:
                warning = f"Load has only {remaining_public_spaces} available public spaces but {required_spaces} are needed"
        
        return warning

    def _validate_staff_assignments(self, db: Session, jump: Jump, load_id: int, reserved: bool, staff_assignments: Optional[Dict[str, int]]):
        """Validate staff assignments if required"""
        additional_staff_required = jump.jump_type.additional_staff
        if not additional_staff_required:
            return
        
        for staff_req in additional_staff_required:
            staff_user_id = None
            if staff_assignments:
                staff_user_id = staff_assignments.get(str(staff_req.id))
            
            if not staff_user_id:
                # Only require staff for new assignments (not when moving between loads)
                if not jump.load_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Staff user_id required for role: {staff_req.staff_required_role.value}"
                    )
                continue
            
            # Validate staff user exists
            staff_user = db.query(User).filter(User.id == staff_user_id).first()
            if not staff_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Staff user {staff_user_id} not found"
                )
            
            # Ensure staff user is not the same as parent jump user
            if staff_user_id == jump.user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Staff user cannot be the same as the jump user"
                )
            
            # Check if staff user already has a jump in this load with the same reserved state
            staff_user_in_load = db.query(Jump).filter(
                Jump.user_id == staff_user_id,
                Jump.load_id == load_id,
                Jump.reserved == reserved
            ).first()
            if staff_user_in_load:
                reservation_type = "reserved" if reserved else "non-reserved"
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Staff user {staff_user_id} already has a {reservation_type} jump in this load"
                )

    def _cleanup_existing_staff_jumps(self, db: Session, jump_id: int):
        """Remove existing staff jumps when reassigning within same load"""
        existing_staff_jumps = self.get_jumps(db, filters={'parent_jump_id': jump_id})
        for staff_jump in existing_staff_jumps:
            db.delete(staff_jump)
        db.flush()  # Ensure deletions are processed

    def _assign_jump_to_load(self, jump: Jump, load: Load, reserved: bool, staff_assignments: Optional[Dict[str, int]], user_id: int):
        """Assign the main jump to the load"""
        jump.load_id = load.id
        jump.is_manifested = True
        jump.reserved = reserved
        jump.staff_assignments = staff_assignments
        jump.updated_by = user_id
        
        # Set jump_date if load is already departed
        if load.status == LoadStatus.DEPARTED:
            jump.jump_date = load.departure

    def _create_staff_jumps(self, db: Session, jump: Jump, load: Load, reserved: bool, staff_assignments: Optional[Dict[str, int]], user_id: int) -> List[int]:
        """Create staff jumps and return their IDs"""
        staff_jump_ids = []
        additional_staff_required = jump.jump_type.additional_staff
        
        for staff_req in additional_staff_required:
            staff_user_id = None
            if staff_assignments:
                staff_user_id = staff_assignments.get(str(staff_req.id))
            
            if staff_user_id:
                staff_jump_type_id = staff_req.staff_default_jump_type_id or jump.jump_type_id
                staff_jump = Jump(
                    user_id=staff_user_id,
                    jump_type_id=staff_jump_type_id,
                    is_manifested=True,
                    load_id=load.id,
                    reserved=reserved,
                    parent_jump_id=jump.id,
                    comment=f"Staff for {jump.user.first_name} {jump.user.last_name}",
                    jump_date=load.departure if load.status == LoadStatus.DEPARTED else None,
                    created_by=user_id
                )
                db.add(staff_jump)
                db.flush()  # Get the ID
                staff_jump_ids.append(staff_jump.id)
        
        return staff_jump_ids

    def remove_from_load(
        self, 
        db: Session, 
        *, 
        jump_id: int, 
        user_id: int,
        clear_staff_assignments: bool = False
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
        
        # Handle staff assignments based on user choice
        if clear_staff_assignments:
            jump.staff_assignments = None
        # Otherwise, keep existing staff_assignments for transfer to another load
        
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

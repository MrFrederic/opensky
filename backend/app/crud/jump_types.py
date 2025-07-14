from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from fastapi import HTTPException
from app.crud.base import CRUDBase
from app.models.jump_types import JumpType, JumpTypeAllowedRole, AdditionalStaff
from app.models.enums import UserRole
from app.schemas.jump_types import JumpTypeCreate, JumpTypeUpdate
import logging

logger = logging.getLogger(__name__)


class CRUDJumpType(CRUDBase[JumpType, JumpTypeCreate, JumpTypeUpdate]):
    def get(self, db: Session, id: int, include_deleted: bool = False) -> Optional[JumpType]:
        """Get jump type by id with allowed roles and additional staff loaded"""
        query = (
            db.query(JumpType)
            .options(
                joinedload(JumpType.allowed_roles), 
                joinedload(JumpType.additional_staff).joinedload(AdditionalStaff.staff_default_jump_type)
            )
            .filter(JumpType.id == id)
        )
        
        if not include_deleted:
            query = query.filter(JumpType.deleted_at.is_(None))
            
        return query.first()

    def get_jump_types(
        self,
        db: Session,
        *,
        filters: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False
    ) -> List[JumpType]:
        """Get jump types with flexible filters - supports combining multiple parameters"""
        query = db.query(JumpType).options(
            joinedload(JumpType.allowed_roles), 
            joinedload(JumpType.additional_staff).joinedload(AdditionalStaff.staff_default_jump_type)
        )
        
        # Exclude soft-deleted records by default
        if not include_deleted:
            query = query.filter(JumpType.deleted_at.is_(None))
        
        if not filters:
            return query.offset(skip).limit(limit).all()

        # Apply search across name and short_name
        if filters.get('search'):
            search_pattern = f"%{filters['search'].lower()}%"
            query = query.filter(
                or_(
                    JumpType.name.ilike(search_pattern),
                    JumpType.short_name.ilike(search_pattern)
                )
            )

        # Apply exact field filters
        for field in ['id', 'is_available']:
            if filters.get(field) is not None:
                query = query.filter(getattr(JumpType, field) == filters[field])

        # Apply allowed role filter
        if filters.get('allowed_role'):
            query = query.join(JumpTypeAllowedRole).filter(
                JumpTypeAllowedRole.role == filters['allowed_role']
            )

        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: JumpTypeCreate, created_by: Optional[int] = None) -> JumpType:
        """Create a new jump type with allowed roles and additional staff"""
        # Extract related data from input
        allowed_roles = obj_in.allowed_roles or []
        additional_staff = obj_in.additional_staff or []
        
        # Prepare jump type data, excluding relationships
        obj_in_data = obj_in.model_dump(exclude={'allowed_roles', 'additional_staff'})
        if created_by is not None:
            obj_in_data['created_by'] = created_by
        
        # Create jump type
        db_obj = JumpType(**obj_in_data)
        db.add(db_obj)
        db.flush()  # Get the jump type ID
        
        # Add allowed roles
        for role in allowed_roles:
            role_assignment = JumpTypeAllowedRole(
                jump_type_id=db_obj.id,
                role=role,
                created_by=created_by
            )
            db.add(role_assignment)
        
        # Add additional staff
        for staff in additional_staff:
            staff_assignment = AdditionalStaff(
                jump_type_id=db_obj.id,
                staff_required_role=staff['staff_required_role'],
                staff_default_jump_type_id=staff.get('staff_default_jump_type_id'),
                created_by=created_by
            )
            db.add(staff_assignment)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_allowed_roles(self, db: Session, *, jump_type: JumpType, roles: List[UserRole], updated_by: Optional[int] = None) -> JumpType:
        """Replace all jump type allowed roles with new ones"""
        # Remove all existing allowed roles
        db.query(JumpTypeAllowedRole).filter(JumpTypeAllowedRole.jump_type_id == jump_type.id).delete()
        
        # Add new allowed roles
        for role in roles:
            role_assignment = JumpTypeAllowedRole(
                jump_type_id=jump_type.id,
                role=role,
                created_by=updated_by
            )
            db.add(role_assignment)
        
        db.commit()
        db.refresh(jump_type)
        return jump_type

    def update_additional_staff(self, db: Session, *, jump_type: JumpType, staff_list: List[dict], updated_by: Optional[int] = None) -> JumpType:
        """Replace all jump type additional staff with new ones"""
        # Remove all existing additional staff
        db.query(AdditionalStaff).filter(AdditionalStaff.jump_type_id == jump_type.id).delete()
        
        # Add new additional staff
        for staff in staff_list:
            staff_assignment = AdditionalStaff(
                jump_type_id=jump_type.id,
                staff_required_role=staff['staff_required_role'],
                staff_default_jump_type_id=staff.get('staff_default_jump_type_id'),
                created_by=updated_by
            )
            db.add(staff_assignment)
        
        db.commit()
        db.refresh(jump_type)
        return jump_type

    def update(self, db: Session, *, db_obj: JumpType, obj_in: JumpTypeUpdate, updated_by: Optional[int] = None) -> JumpType:
        """Update jump type with relationships"""
        # Extract relationship data
        update_data = obj_in.model_dump(exclude_unset=True)
        allowed_roles = update_data.pop('allowed_roles', None)
        additional_staff = update_data.pop('additional_staff', None)
        
        # Update basic fields
        if update_data:
            if updated_by is not None:
                update_data['updated_by'] = updated_by
            db_obj = super().update(db, db_obj=db_obj, obj_in=update_data)
        
        # Update allowed roles if provided
        if allowed_roles is not None:
            db_obj = self.update_allowed_roles(
                db, jump_type=db_obj, roles=allowed_roles, updated_by=updated_by
            )
        
        # Update additional staff if provided
        if additional_staff is not None:
            db_obj = self.update_additional_staff(
                db, jump_type=db_obj, staff_list=additional_staff, updated_by=updated_by
            )
        
        return db_obj

    def has_linked_objects(self, db: Session, *, jump_type_id: int) -> bool:
        """Check if jump type has linked jumps or is used as default in additional staff"""
        from app.models.jumps import Jump
        
        # Check for linked jumps
        linked_jumps_count = db.query(Jump).filter(Jump.jump_type_id == jump_type_id).count()
        if linked_jumps_count > 0:
            return True
            
        # Check if used as default jump type in additional staff
        linked_additional_staff_count = db.query(AdditionalStaff).filter(
            AdditionalStaff.staff_default_jump_type_id == jump_type_id
        ).count()
        
        return linked_additional_staff_count > 0

    def remove(self, db: Session, *, id: int, deleted_by: Optional[int] = None) -> JumpType:
        """Delete jump type - use soft delete if linked objects exist, hard delete otherwise"""
        jump_type = self.get(db, id=id, include_deleted=False)
        if not jump_type:
            raise HTTPException(status_code=404, detail="Jump type not found")
        
        # Check for linked objects FIRST, before any deletion attempt
        has_links = self.has_linked_objects(db, jump_type_id=id)
        
        if has_links:
            # Soft delete if there are linked objects
            result = self.soft_delete(db, id=id, deleted_by=deleted_by)
            if result:
                return result  # Return the soft-deleted object for consistency
            else:
                raise HTTPException(status_code=500, detail="Failed to soft delete jump type")
        else:
            # Hard delete if no linked objects (this will also delete allowed roles and additional staff due to cascade)
            try:
                return super().remove(db, id=id)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to delete jump type: {str(e)}")


jump_type = CRUDJumpType(JumpType)

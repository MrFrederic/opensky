from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.crud.base import CRUDBase
from app.models.users import User, UserRoleAssignment
from app.models.enums import UserRole
from app.schemas.users import UserCreate, UserUpdate
import logging

logger = logging.getLogger(__name__)


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get(self, db: Session, id: int) -> Optional[User]:
        """Get user by id with roles loaded"""
        return db.query(User).options(joinedload(User.roles)).filter(User.id == id).first()

    def get_users(
        self,
        db: Session,
        *,
        filters: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Get users with flexible filters - supports combining multiple parameters"""
        query = db.query(User).options(joinedload(User.roles))
        
        if not filters:
            return query.offset(skip).limit(limit).all()

        # Apply search across multiple fields
        if filters.get('search'):
            search_pattern = f"%{filters['search'].lower()}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern),
                    User.username.ilike(search_pattern),
                    User.phone.ilike(search_pattern),
                    User.email.ilike(search_pattern)
                )
            )

        # Apply exact field filters
        for field in ['id', 'telegram_id', 'username', 'email']:
            if filters.get(field):
                query = query.filter(getattr(User, field) == filters[field])

        # Apply role filter
        if filters.get('role'):
            query = query.join(UserRoleAssignment).filter(UserRoleAssignment.role == filters['role'])

        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: UserCreate, created_by: Optional[int] = None) -> User:
        """Create a new user with roles"""
        # Extract roles from input or use default
        roles = obj_in.roles if obj_in.roles else [UserRole.TANDEM_JUMPER]
        
        # Prepare user data, excluding roles and photo_url
        obj_in_data = obj_in.model_dump(exclude={'roles', 'photo_url'})
        if created_by is not None:
            obj_in_data['created_by'] = created_by
        
        # Convert empty strings to None for nullable fields
        nullable_fields = [
            'username', 'email', 'phone', 'middle_name', 'display_name', 
            'emergency_contact_name', 'emergency_contact_phone'
        ]
        for field in nullable_fields:
            if field in obj_in_data and obj_in_data[field] == '':
                obj_in_data[field] = None
        
        # Create user
        db_obj = User(**obj_in_data)
        db.add(db_obj)
        db.flush()  # Get the user ID
        
        # Add roles
        for role in roles:
            role_assignment = UserRoleAssignment(
                user_id=db_obj.id,
                role=role,
                created_by=created_by
            )
            db.add(role_assignment)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def manage_role(self, db: Session, *, user: User, role: UserRole, action: str, created_by: Optional[int] = None) -> User:
        """Add or remove a role from a user"""
        existing_role = (
            db.query(UserRoleAssignment)
            .filter(UserRoleAssignment.user_id == user.id, UserRoleAssignment.role == role)
            .first()
        )
        
        if action == "add" and not existing_role:
            role_assignment = UserRoleAssignment(
                user_id=user.id,
                role=role,
                created_by=created_by
            )
            db.add(role_assignment)
        elif action == "remove" and existing_role:
            db.delete(existing_role)
        
        db.commit()
        db.refresh(user)
        return user

    def update_roles(self, db: Session, *, user: User, roles: List[UserRole], updated_by: Optional[int] = None) -> User:
        """Replace all user roles with new ones"""
        # Remove all existing roles
        db.query(UserRoleAssignment).filter(UserRoleAssignment.user_id == user.id).delete()
        
        # Add new roles
        for role in roles:
            role_assignment = UserRoleAssignment(
                user_id=user.id,
                role=role,
                created_by=updated_by
            )
            db.add(role_assignment)
        
        db.commit()
        db.refresh(user)
        return user

    def has_role(self, db: Session, *, user: User, role: UserRole) -> bool:
        """Check if user has a specific role"""
        return (
            db.query(UserRoleAssignment)
            .filter(UserRoleAssignment.user_id == user.id, UserRoleAssignment.role == role)
            .first()
        ) is not None

    def update_field(self, db: Session, *, user: User, field: str, value: Any) -> User:
        """Update a single field on a user"""
        if hasattr(user, field):
            setattr(user, field, value)
            db.add(user)
            db.commit()
            db.refresh(user)
        return user


user = CRUDUser(User)

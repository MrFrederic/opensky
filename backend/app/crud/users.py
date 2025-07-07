from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from app.crud.base import CRUDBase
from app.models.base import User, UserRole, UserRoleAssignment
from app.schemas.users import UserCreate, UserUpdate


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
        """Get users with flexible filters (id, telegram_id, username, email, role, search, etc)"""
        query = db.query(User).options(joinedload(User.roles))
        if filters:
            if 'search' in filters and filters['search']:
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
            if 'id' in filters:
                query = query.filter(User.id == filters['id'])
            if 'telegram_id' in filters:
                query = query.filter(User.telegram_id == filters['telegram_id'])
            if 'username' in filters:
                query = query.filter(User.username == filters['username'])
            if 'email' in filters:
                query = query.filter(User.email == filters['email'])
            if 'role' in filters:
                query = query.join(UserRoleAssignment).filter(UserRoleAssignment.role == filters['role'])
        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: UserCreate, created_by: Optional[int] = None) -> User:
        """Create a new user with default tandem_jumper role"""
        # Extract roles from input or use default
        roles = obj_in.roles if obj_in.roles else [UserRole.TANDEM_JUMPER]
        
        # Create user without roles first
        obj_in_data = obj_in.model_dump(exclude={'roles'})
        if created_by is not None:
            obj_in_data['created_by'] = created_by
        
        # Convert empty strings to None for nullable fields to avoid unique constraint issues
        nullable_fields = ['username', 'email', 'phone']
        for field in nullable_fields:
            if field in obj_in_data and obj_in_data[field] == '':
                obj_in_data[field] = None
            
        db_obj = User(**obj_in_data)
        db.add(db_obj)
        db.flush()  # Flush to get the user ID
        
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

    def get_admins(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all admin users"""
        return self.get_users(db, filters={"role": UserRole.ADMINISTRATOR}, skip=skip, limit=limit)
    
    def add_role(self, db: Session, *, user: User, role: UserRole, created_by: Optional[int] = None) -> User:
        """Add a role to a user"""
        # Check if user already has this role
        existing_role = (
            db.query(UserRoleAssignment)
            .filter(UserRoleAssignment.user_id == user.id, UserRoleAssignment.role == role)
            .first()
        )
        
        if not existing_role:
            role_assignment = UserRoleAssignment(
                user_id=user.id,
                role=role,
                created_by=created_by
            )
            db.add(role_assignment)
            db.commit()
            db.refresh(user)
        
        return user
    
    def remove_role(self, db: Session, *, user: User, role: UserRole) -> User:
        """Remove a role from a user"""
        role_assignment = (
            db.query(UserRoleAssignment)
            .filter(UserRoleAssignment.user_id == user.id, UserRoleAssignment.role == role)
            .first()
        )
        
        if role_assignment:
            db.delete(role_assignment)
            db.commit()
            db.refresh(user)
        
        return user
    
    def update_roles(self, db: Session, *, user: User, roles: List[UserRole], updated_by: Optional[int] = None) -> User:
        """Update all roles for a user"""
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
        role_assignment = (
            db.query(UserRoleAssignment)
            .filter(UserRoleAssignment.user_id == user.id, UserRoleAssignment.role == role)
            .first()
        )
        return role_assignment is not None
    
    def is_admin(self, db: Session, *, user: User) -> bool:
        """Check if user is an administrator"""
        return self.has_role(db, user=user, role=UserRole.ADMINISTRATOR)

    def update_license_document(self, db: Session, *, user: User, document_url: str) -> User:
        """Update user's license document URL"""
        user.license_document_url = document_url
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


user = CRUDUser(User)

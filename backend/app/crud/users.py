from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.crud.base import CRUDBase
from app.models.base import User, UserRole, UserRoleAssignment
from app.schemas.users import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get(self, db: Session, id: int) -> Optional[User]:
        """Get user by id with roles loaded"""
        return db.query(User).options(joinedload(User.roles)).filter(User.id == id).first()
    
    def get_by_telegram_id(self, db: Session, *, telegram_id: str) -> Optional[User]:
        """Get user by Telegram ID with roles loaded"""
        return (
            db.query(User)
            .options(joinedload(User.roles))
            .filter(User.telegram_id == telegram_id)
            .first()
        )

    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        """Get user by username with roles loaded"""
        return (
            db.query(User)
            .options(joinedload(User.roles))
            .filter(User.username == username)
            .first()
        )

    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        """Get user by email with roles loaded"""
        return (
            db.query(User)
            .options(joinedload(User.roles))
            .filter(User.email == email)
            .first()
        )

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

    def search_users(self, db: Session, *, query: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Search users by name or username"""
        search_pattern = f"%{query.lower()}%"
        return (
            db.query(User)
            .options(joinedload(User.roles))
            .filter(
                or_(
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern),
                    User.username.ilike(search_pattern)
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_users_by_role(self, db: Session, *, role: UserRole, skip: int = 0, limit: int = 100) -> List[User]:
        """Get users by role"""
        return (
            db.query(User)
            .options(joinedload(User.roles))
            .join(UserRoleAssignment)
            .filter(UserRoleAssignment.role == role)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_admins(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all admin users"""
        return self.get_users_by_role(db, role=UserRole.ADMINISTRATOR, skip=skip, limit=limit)
    
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

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.crud.base import CRUDBase
from app.models.base import User, UserStatus
from app.schemas.users import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_telegram_id(self, db: Session, *, telegram_id: str) -> Optional[User]:
        """Get user by Telegram ID"""
        return db.query(User).filter(User.telegram_id == telegram_id).first()

    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        """Get user by username"""
        return db.query(User).filter(User.username == username).first()

    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()

    def search_users(self, db: Session, *, query: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Search users by name or username"""
        search_pattern = f"%{query.lower()}%"
        return (
            db.query(User)
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

    def get_users_by_status(self, db: Session, *, status: UserStatus, skip: int = 0, limit: int = 100) -> List[User]:
        """Get users by status"""
        return (
            db.query(User)
            .filter(User.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_admins(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all admin users"""
        return (
            db.query(User)
            .filter(User.is_admin == True)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_license_document(self, db: Session, *, user: User, document_url: str) -> User:
        """Update user's license document URL"""
        user.license_document_url = document_url
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


user = CRUDUser(User)

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token
from app.crud.users import user as user_crud
from app.models.base import User, UserStatus

security = HTTPBearer()


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Get current authenticated user from JWT token
    """
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    telegram_id: str = payload.get("sub")
    if telegram_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = user_crud.get_by_telegram_id(db, telegram_id=telegram_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get current active user (additional checks can be added here)
    """
    return current_user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Require admin privileges
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


def get_sportsman_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Require sportsman status or admin privileges
    """
    allowed_statuses = [UserStatus.SPORTSMAN, UserStatus.INDIVIDUAL_SPORTSMAN, UserStatus.INSTRUCTOR]
    if current_user.status not in allowed_statuses and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sportsman status or admin privileges required"
        )
    return current_user


def get_instructor_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Require instructor status or admin privileges
    """
    if current_user.status != UserStatus.INSTRUCTOR and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor status or admin privileges required"
        )
    return current_user

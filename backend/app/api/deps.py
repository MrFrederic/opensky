from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token
from app.crud.users import user as user_crud
from app.models.base import User, UserRole

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
    
    # Try to get user by user_id first (more efficient) or telegram_id as fallback
    user = None
    user_id: Optional[int] = payload.get("user_id")
    telegram_id: Optional[str] = payload.get("sub")
    
    if user_id:
        user = user_crud.get(db, id=user_id)
    elif telegram_id:
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
    user_roles = [role_assignment.role for role_assignment in current_user.roles]
    if UserRole.ADMINISTRATOR not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required"
        )
    return current_user


def get_user_with_roles(required_roles: List[UserRole]):
    """
    Create a dependency that requires any of the specified roles
    """
    def check_roles(current_user: User = Depends(get_current_user)) -> User:
        user_roles = [role_assignment.role for role_assignment in current_user.roles]
        
        # Admin always has access
        if UserRole.ADMINISTRATOR in user_roles:
            return current_user
            
        # Check if user has any of the required roles
        if not any(role in user_roles for role in required_roles):
            roles_str = ", ".join([role.value for role in required_roles])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these roles required: {roles_str}"
            )
        return current_user
    
    return check_roles


def get_sport_jumper_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Require sport jumper roles or admin privileges
    """
    user_roles = [role_assignment.role for role_assignment in current_user.roles]
    allowed_roles = [UserRole.SPORT_PAID, UserRole.SPORT_FREE, UserRole.ADMINISTRATOR]
    
    if not any(role in user_roles for role in allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sport jumper status or admin privileges required"
        )
    return current_user


def get_instructor_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Require instructor status or admin privileges
    """
    user_roles = [role_assignment.role for role_assignment in current_user.roles]
    allowed_roles = [UserRole.TANDEM_INSTRUCTOR, UserRole.AFF_INSTRUCTOR, UserRole.ADMINISTRATOR]
    
    if not any(role in user_roles for role in allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor status or admin privileges required"
        )
    return current_user


def get_tandem_instructor_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Require tandem instructor status or admin privileges
    """
    user_roles = [role_assignment.role for role_assignment in current_user.roles]
    allowed_roles = [UserRole.TANDEM_INSTRUCTOR, UserRole.ADMINISTRATOR]
    
    if not any(role in user_roles for role in allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tandem instructor status or admin privileges required"
        )
    return current_user


def get_aff_instructor_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Require AFF instructor status or admin privileges
    """
    user_roles = [role_assignment.role for role_assignment in current_user.roles]
    allowed_roles = [UserRole.AFF_INSTRUCTOR, UserRole.ADMINISTRATOR]
    
    if not any(role in user_roles for role in allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AFF instructor status or admin privileges required"
        )
    return current_user

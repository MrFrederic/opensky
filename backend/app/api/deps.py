from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token
from app.crud.users import user as user_crud
from app.crud.temp_tokens import temp_token as temp_token_crud
from app.models.users import User, TemporaryToken
from app.models.enums import UserRole

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
    
    # Check if this is a temp token (should not be used for normal auth)
    if payload.get("type") == "temp":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Temporary token not valid for this endpoint",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Try to get user by user_id first (more efficient) or telegram_id as fallback
    user = None
    user_id: Optional[int] = payload.get("user_id")
    telegram_id: Optional[str] = payload.get("sub")
    if user_id:
        user = user_crud.get(db, id=user_id)
    elif telegram_id:
        users = user_crud.get_users(db, filters={"telegram_id": telegram_id})
        user = users[0] if users else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user has completed registration
    if not user.registration_completed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration not completed",
        )
    
    return user


def get_temp_authenticated_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TemporaryToken:
    """
    Get temporary token data for registration endpoints
    """
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if this is a temp token
    if payload.get("type") != "temp":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid temporary token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get temp token from database
    token_data = payload.get("token_data")
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    temp_token = temp_token_crud.get_temp_token(db, token_data)
    if not temp_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Temporary token not found or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return temp_token


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

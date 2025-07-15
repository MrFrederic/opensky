# app/core/permissions.py - Single source of truth for permissions
from typing import List, Set
from functools import wraps
from fastapi import HTTPException, status
from app.models.enums import UserRole

# Role-permission mapping - Single source of truth
ROLE_PERMISSIONS = {
    UserRole.TANDEM_JUMPER: [
        "VIEW_DASHBOARD",
        "VIEW_TANDEMS",
    ],
    UserRole.AFF_STUDENT: [
        "VIEW_DASHBOARD",
        "VIEW_TANDEMS",
        "VIEW_MANIFEST",
        "VIEW_LOGBOOK",
        "VIEW_LOADS",
    ],
    UserRole.SPORT_PAID: [
        "VIEW_DASHBOARD",
        "VIEW_TANDEMS",
        "VIEW_MANIFEST", 
        "CREATE_LOAD",
        "VIEW_LOADS",
        "VIEW_LOGBOOK",
        "JOIN_MANIFEST",
    ],
    UserRole.SPORT_FREE: [
        "VIEW_DASHBOARD",
        "VIEW_TANDEMS",
        "VIEW_MANIFEST",
        "VIEW_LOADS",
        "VIEW_LOGBOOK",
        "JOIN_MANIFEST",
    ],
    UserRole.TANDEM_INSTRUCTOR: [
        "VIEW_DASHBOARD",
        "VIEW_TANDEMS",
        "VIEW_MANIFEST",
        "VIEW_LOADS",
        "VIEW_LOGBOOK",
        "INSTRUCTOR_ACCESS",
        "TANDEM_INSTRUCTOR_ACCESS",
        "APPROVE_JUMPS",
        "CREATE_LOAD",
        "MANAGE_MANIFEST",
    ],
    UserRole.AFF_INSTRUCTOR: [
        "VIEW_DASHBOARD",
        "VIEW_TANDEMS",
        "VIEW_MANIFEST",
        "VIEW_LOADS",
        "VIEW_LOGBOOK",
        "INSTRUCTOR_ACCESS",
        "AFF_INSTRUCTOR_ACCESS",
        "APPROVE_JUMPS",
        "CREATE_LOAD",
        "MANAGE_MANIFEST",
    ],
    UserRole.ADMINISTRATOR: [
        "VIEW_DASHBOARD",
        "VIEW_TANDEMS",
        "VIEW_MANIFEST",
        "VIEW_LOADS",
        "VIEW_LOGBOOK",
        "VIEW_ADMIN_PANEL",
        "MANAGE_USERS",
        "MANAGE_LOADS",
        "MANAGE_AIRCRAFT",
        "MANAGE_JUMP_TYPES",
        "MANAGE_SETTINGS",
        "APPROVE_JUMPS",
        "CREATE_LOAD",
        "MANAGE_MANIFEST",
        "INSTRUCTOR_ACCESS",
        "TANDEM_INSTRUCTOR_ACCESS",
        "AFF_INSTRUCTOR_ACCESS",
        "ADMIN_ACCESS",
        # All permissions for admin - they have access to everything
    ],
}


def get_user_permissions(user_roles: List[UserRole]) -> Set[str]:
    """Get all permissions for a list of user roles."""
    permissions = set()
    for role in user_roles:
        role_permissions = ROLE_PERMISSIONS.get(role, [])
        permissions.update(role_permissions)
    return permissions


def has_permission(user_roles: List[UserRole], permission: str) -> bool:
    """Check if user has a specific permission."""
    user_permissions = get_user_permissions(user_roles)
    return permission in user_permissions


def require_permission(permission: str):
    """Decorator to require permission for API endpoints."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract current_user from kwargs (it should be injected by FastAPI dependencies)
            current_user = kwargs.get('current_user')
            if not current_user:
                # Try to find it in args (fallback)
                for arg in args:
                    if hasattr(arg, 'roles'):
                        current_user = arg
                        break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Get user roles
            user_roles = [role_assignment.role for role_assignment in current_user.roles]
            
            if not has_permission(user_roles, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' required"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

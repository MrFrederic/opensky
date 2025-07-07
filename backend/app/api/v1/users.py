from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_admin_user
from app.core.database import get_db
from app.crud.users import user as user_crud
from app.schemas.users import UserResponse, UserUpdate, UserSummary, UserRoleUpdate, UserCreate
from app.models.base import User, UserRole

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user information"""
    # Users can only update certain fields themselves
    allowed_fields = {"first_name", "last_name", "username", "email", "phone"}
    update_data = {k: v for k, v in user_update.model_dump(exclude_unset=True).items() if k in allowed_fields}
    
    if not update_data:
        return current_user
    
    return user_crud.update(
        db, 
        db_obj=current_user, 
        obj_in=update_data,
        updated_by=current_user.id
    )


@router.post("/me/request-sport-license")
def request_sport_license(
    license_document_url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Request sport license upload for potential role upgrade"""
    # Check if user has only tandem_jumper role (basic role)
    user_roles = [role_assignment.role for role_assignment in current_user.roles]
    if len(user_roles) != 1 or UserRole.TANDEM_JUMPER not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only users with basic tandem jumper role can request sport license upgrade"
        )
    
    user_crud.update_license_document(
        db,
        user=current_user,
        document_url=license_document_url
    )
    
    return {"message": "Sport license submitted. Waiting for admin approval for role upgrade."}


# Admin endpoints
@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: UserRole = Query(None),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """List all users (admin only)"""
    if role:
        return user_crud.get_users_by_role(db, role=role, skip=skip, limit=limit)
    return user_crud.get_multi(db, skip=skip, limit=limit)


@router.get("/search", response_model=List[UserResponse])
def search_users(
    q: str = Query(..., min_length=2),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Search users by name or username (admin only)"""
    return user_crud.search_users(db, query=q, skip=skip, limit=limit)


@router.post("/", response_model=UserResponse)
def create_user(
    user_create: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create a new user (admin only)"""
    # Check if user with same telegram_id already exists
    existing_user = user_crud.get_by_telegram_id(db, telegram_id=user_create.telegram_id)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this Telegram ID already exists"
        )
    
    # Check if username is provided and already exists
    if user_create.username and user_create.username.strip():
        existing_username = user_crud.get_by_username(db, username=user_create.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
    
    # Check if email is provided and already exists
    if user_create.email and user_create.email.strip():
        existing_email = user_crud.get_by_email(db, email=user_create.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
    
    return user_crud.create(db, obj_in=user_create, created_by=admin_user.id)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get user by ID (admin only)"""
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update user (admin only)"""
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user_crud.update(
        db,
        db_obj=user,
        obj_in=user_update,
        updated_by=admin_user.id
    )


@router.put("/{user_id}/roles", response_model=UserResponse)
def update_user_roles(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update user roles (admin only)"""
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user_crud.update_roles(
        db,
        user=user,
        roles=role_update.roles,
        updated_by=admin_user.id
    )


@router.post("/{user_id}/roles/{role}")
def add_user_role(
    user_id: int,
    role: UserRole,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Add a role to user (admin only)"""
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_crud.add_role(db, user=user, role=role, created_by=admin_user.id)
    return {"message": f"Role {role.value} added to user"}


@router.delete("/{user_id}/roles/{role}")
def remove_user_role(
    user_id: int,
    role: UserRole,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Remove a role from user (admin only)"""
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent removing the last role from a user
    user_roles = [role_assignment.role for role_assignment in user.roles]
    if len(user_roles) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the last role from a user"
        )
    
    user_crud.remove_role(db, user=user, role=role)
    return {"message": f"Role {role.value} removed from user"}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Delete user (admin only)"""
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admins from deleting themselves
    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete yourself"
        )
    
    user_crud.remove(db, id=user_id)
    return {"message": "User deleted successfully"}

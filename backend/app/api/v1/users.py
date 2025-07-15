from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_admin_user
from app.core.database import get_db
from app.core.permissions import get_user_permissions
from app.crud.users import user as user_crud
from app.schemas.users import UserResponse, UserUpdate, UserCreate
from app.models.users import User
from app.models.enums import UserRole

router = APIRouter()


#====================#
#                    #
#   User Endpoints   #
#                    #
#====================#

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return current_user


@router.get("/me/permissions")
def get_current_user_permissions(
    current_user: User = Depends(get_current_user)
):
    """Get current user's permissions"""
    user_roles = [role_assignment.role for role_assignment in current_user.roles]
    permissions = list(get_user_permissions(user_roles))
    return {"permissions": permissions}


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user information"""
    # Users can only update certain fields themselves
    allowed_fields = {
        "first_name", "middle_name", "last_name", "display_name", 
        "username", "email", "phone", "date_of_birth", 
        "emergency_contact_name", "emergency_contact_phone", "gender", "photo_url",
        "medical_clearance_date"  # Allow users to update their medical clearance date
    }
    update_data = {k: v for k, v in user_update.model_dump(exclude_unset=True).items() if k in allowed_fields}
    
    if not update_data:
        return current_user
    
    return user_crud.update(
        db, 
        db_obj=current_user, 
        obj_in=update_data,
        updated_by=current_user.id
    )



#=====================#
#                     #
#   Admin Endpoints   #
#                     #
#=====================#

@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role: UserRole = Query(None),
    search: str = Query(None, min_length=2),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """List all users or search users by name or username (admin only)"""
    filters = {}
    if search:
        filters['search'] = search
    if role:
        filters['role'] = role
    return user_crud.get_users(db, filters=filters, skip=skip, limit=limit)


@router.post("/", response_model=UserResponse)
def create_user(
    user_create: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create a new user (admin only)"""
    # Check if user with same telegram_id already exists (only if telegram_id is provided)
    if user_create.telegram_id and user_create.telegram_id.strip():
        existing_user = user_crud.get_users(db, filters={"telegram_id": user_create.telegram_id})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this Telegram ID already exists"
            )
    # Check if username is provided and already exists
    if user_create.username and user_create.username.strip():
        existing_username = user_crud.get_users(db, filters={"username": user_create.username})
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
    # Check if email is provided and already exists
    if user_create.email and user_create.email.strip():
        existing_email = user_crud.get_users(db, filters={"email": user_create.email})
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
    return user_crud.create(db, obj_in=user_create, created_by=admin_user.id)


@router.get("/{user_id}", response_model=UserResponse)
def read_user(
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
    """Update user including roles (admin only)"""
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Extract roles from the update data if provided
    update_data = user_update.model_dump(exclude_unset=True)
    roles = update_data.pop('roles', None)
    
    # Update user fields first if any are provided
    if update_data:
        user = user_crud.update(
            db,
            db_obj=user,
            obj_in=update_data,
            updated_by=admin_user.id
        )
    
    # Update roles if provided
    if roles is not None:
        user = user_crud.update_roles(
            db,
            user=user,
            roles=roles,
            updated_by=admin_user.id
        )
    
    return user


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

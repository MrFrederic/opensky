from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_admin_user
from app.core.database import get_db
from app.crud.users import user as user_crud
from app.schemas.users import UserResponse, UserUpdate, UserSummary
from app.models.base import User, UserStatus

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
    update_data = {k: v for k, v in user_update.dict(exclude_unset=True).items() if k in allowed_fields}
    
    if not update_data:
        return current_user
    
    return user_crud.update(
        db, 
        db_obj=current_user, 
        obj_in=update_data,
        updated_by=current_user.id
    )


@router.post("/me/request-sportsman-status")
def request_sportsman_status(
    license_document_url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Request upgrade to sportsman status"""
    if current_user.status != UserStatus.NEWBY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only users with 'newby' status can request sportsman upgrade"
        )
    
    user_crud.update_license_document(
        db,
        user=current_user,
        document_url=license_document_url
    )
    
    return {"message": "Sportsman status request submitted. Waiting for admin approval."}


# Admin endpoints
@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: UserStatus = Query(None),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """List all users (admin only)"""
    if status:
        return user_crud.get_users_by_status(db, status=status, skip=skip, limit=limit)
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
    
    user_crud.remove(db, id=user_id)
    return {"message": "User deleted successfully"}

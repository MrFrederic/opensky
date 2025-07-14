from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_admin_user
from app.core.database import get_db
from app.crud.jump_types import jump_type as jump_type_crud
from app.schemas.jump_types import JumpTypeResponse, JumpTypeUpdate, JumpTypeCreate
from app.models.users import User
from app.models.enums import UserRole

router = APIRouter()


#=========================#
#                         #
#   Jump Type Endpoints   #
#                         #
#=========================#

@router.get("/", response_model=List[JumpTypeResponse])
def list_jump_types(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    allowed_role: UserRole = Query(None),
    is_available: bool = Query(None),
    search: str = Query(None, min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all jump types with optional filters"""
    filters = {}
    if search:
        filters['search'] = search
    if allowed_role:
        filters['allowed_role'] = allowed_role
    if is_available is not None:
        filters['is_available'] = is_available
    
    return jump_type_crud.get_jump_types(db, filters=filters, skip=skip, limit=limit)


@router.get("/{jump_type_id}", response_model=JumpTypeResponse)
def read_jump_type(
    jump_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get jump type by ID"""
    jump_type = jump_type_crud.get(db, id=jump_type_id)
    if not jump_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jump type not found"
        )
    return jump_type


#=========================#
#                         #
#   Admin Endpoints       #
#                         #
#=========================#

@router.post("/", response_model=JumpTypeResponse)
def create_jump_type(
    jump_type_create: JumpTypeCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create a new jump type (admin only)"""
    return jump_type_crud.create(db, obj_in=jump_type_create, created_by=admin_user.id)


@router.put("/{jump_type_id}", response_model=JumpTypeResponse)
def update_jump_type(
    jump_type_id: int,
    jump_type_update: JumpTypeUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update jump type including allowed roles and additional staff (admin only)"""
    jump_type = jump_type_crud.get(db, id=jump_type_id)
    if not jump_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jump type not found"
        )
    
    return jump_type_crud.update(
        db,
        db_obj=jump_type,
        obj_in=jump_type_update,
        updated_by=admin_user.id
    )


@router.delete("/{jump_type_id}")
def delete_jump_type(
    jump_type_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Delete jump type (admin only)"""
    jump_type = jump_type_crud.get(db, id=jump_type_id)
    if not jump_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jump type not found"
        )
    
    jump_type_crud.remove(db, id=jump_type_id, deleted_by=admin_user.id)
    return {"message": "Jump type deleted successfully"}

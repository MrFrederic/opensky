from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_admin_user, get_sport_jumper_or_admin
from app.core.database import get_db
from app.crud.loads import load as load_crud, jump as jump_crud
from app.schemas.loads import (
    LoadResponse, LoadCreate, LoadUpdate,
    JumpResponse, JumpCreate, JumpUpdate
)
from app.models.base import User, UserRole

router = APIRouter()


# Load endpoints
@router.get("/loads", response_model=List[LoadResponse])
def list_loads(
    start_date: date = Query(None),
    end_date: date = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_sport_jumper_or_admin)
):
    """List loads"""
    if start_date and end_date:
        return load_crud.get_by_date_range(db, start_date=start_date, end_date=end_date)
    elif start_date:
        return load_crud.get_by_date(db, load_date=start_date)
    return load_crud.get_multi(db, skip=skip, limit=limit)


@router.post("/loads", response_model=LoadResponse)
def create_load(
    load_data: LoadCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create load (admin only)"""
    return load_crud.create(db, obj_in=load_data, created_by=admin_user.id)


@router.get("/loads/{load_id}", response_model=LoadResponse)
def get_load(
    load_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_sport_jumper_or_admin)
):
    """Get load by ID"""
    load = load_crud.get(db, id=load_id)
    if not load:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Load not found"
        )
    return load


@router.put("/loads/{load_id}", response_model=LoadResponse)
def update_load(
    load_id: int,
    load_update: LoadUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update load (admin only)"""
    load = load_crud.get(db, id=load_id)
    if not load:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Load not found"
        )
    
    return load_crud.update(
        db,
        db_obj=load,
        obj_in=load_update,
        updated_by=admin_user.id
    )


@router.delete("/loads/{load_id}")
def delete_load(
    load_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Delete load (admin only)"""
    load = load_crud.get(db, id=load_id)
    if not load:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Load not found"
        )
    
    load_crud.remove(db, id=load_id)
    return {"message": "Load deleted successfully"}


@router.get("/loads/{load_id}/jumps", response_model=List[JumpResponse])
def get_load_jumps(
    load_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_sport_jumper_or_admin)
):
    """Get all jumps in a load"""
    load = load_crud.get(db, id=load_id)
    if not load:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Load not found"
        )
    
    return jump_crud.get_by_load(db, load_id=load_id)


# Jump endpoints
@router.get("/jumps/me", response_model=List[JumpResponse])
def get_my_jumps(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's jumps (logbook)"""
    return jump_crud.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/jumps/me/stats")
def get_my_jump_stats(
    start_date: date = Query(None),
    end_date: date = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's jump statistics"""
    return jump_crud.get_user_jump_stats(
        db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )


@router.post("/jumps", response_model=JumpResponse)
def create_jump(
    jump_data: JumpCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create jump (admin only)"""
    return jump_crud.create_with_equipment(db, obj_in=jump_data, created_by=admin_user.id)


@router.get("/jumps/{jump_id}", response_model=JumpResponse)
def get_jump(
    jump_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get jump by ID"""
    jump = jump_crud.get(db, id=jump_id)
    if not jump:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jump not found"
        )
    
    # Users can only see their own jumps unless they're admin
    user_roles = [role_assignment.role for role_assignment in current_user.roles]
    if jump.user_id != current_user.id and UserRole.ADMINISTRATOR not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return jump


@router.put("/jumps/{jump_id}", response_model=JumpResponse)
def update_jump(
    jump_id: int,
    jump_update: JumpUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update jump (admin only)"""
    jump = jump_crud.get(db, id=jump_id)
    if not jump:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jump not found"
        )
    
    return jump_crud.update(
        db,
        db_obj=jump,
        obj_in=jump_update,
        updated_by=admin_user.id
    )


@router.delete("/jumps/{jump_id}")
def delete_jump(
    jump_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Delete jump (admin only)"""
    jump = jump_crud.get(db, id=jump_id)
    if not jump:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jump not found"
        )
    
    jump_crud.remove(db, id=jump_id)
    return {"message": "Jump deleted successfully"}


# Admin endpoints
@router.get("/jumps", response_model=List[JumpResponse])
def list_all_jumps(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """List all jumps (admin only)"""
    return jump_crud.get_multi(db, skip=skip, limit=limit)

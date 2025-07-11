from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_admin_user
from app.core.database import get_db
from app.crud.loads import load as load_crud
from app.schemas.loads import LoadResponse, LoadUpdate, LoadCreate, LoadStatusUpdate, LoadReservedSpacesUpdate, LoadSpacesResponse
from app.models.users import User
from app.models.enums import LoadStatus

router = APIRouter()


#=========================#
#                         #
#   Load Endpoints        #
#                         #
#=========================#

@router.get("/", response_model=List[LoadResponse])
def list_loads(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    aircraft_id: int = Query(None),
    departure_from: datetime = Query(None),
    departure_to: datetime = Query(None),
    status: LoadStatus = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all loads with optional filters"""
    filters = {}
    if aircraft_id:
        filters['aircraft_id'] = aircraft_id
    if departure_from:
        filters['departure_from'] = departure_from
    if departure_to:
        filters['departure_to'] = departure_to
    if status:
        filters['status'] = status
    
    return load_crud.get_loads(db, filters=filters, skip=skip, limit=limit)


@router.get("/{load_id}", response_model=LoadResponse)
def read_load(
    load_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get load by ID"""
    load = load_crud.get(db, id=load_id)
    if not load:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Load not found"
        )
    return load


#=========================#
#                         #
#   Admin Endpoints       #
#                         #
#=========================#

@router.post("/", response_model=LoadResponse)
def create_load(
    load_create: LoadCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create a new load (admin only) - always created with status=forming and reserved_spaces=0"""
    return load_crud.create(db, obj_in=load_create, created_by=admin_user.id)


@router.put("/{load_id}", response_model=LoadResponse)
def update_load(
    load_id: int,
    load_update: LoadUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update load basic information (admin only) - excludes status and reserved_spaces"""
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


@router.delete("/{load_id}")
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


#=========================#
#                         #
#   Load Status Endpoints #
#                         #
#=========================#

@router.patch("/{load_id}/status", response_model=LoadResponse)
def update_load_status(
    load_id: int,
    status_update: LoadStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update load status (admin only)"""
    load = load_crud.get(db, id=load_id)
    if not load:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Load not found"
        )
    
    return load_crud.update_status(
        db,
        db_obj=load,
        new_status=status_update.status,
        updated_by=admin_user.id
    )


#=========================#
#                         #
#   Reserved Spaces       #
#                         #
#=========================#

@router.patch("/{load_id}/spaces", response_model=LoadSpacesResponse)
def update_load_spaces(
    load_id: int,
    spaces_update: LoadReservedSpacesUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update reserved spaces for load and return spaces information (admin only)"""
    load = load_crud.get(db, id=load_id)
    if not load:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Load not found"
        )
    
    # Update the reserved spaces
    updated_load = load_crud.update_reserved_spaces(
        db,
        db_obj=load,
        reserved_spaces=spaces_update.reserved_spaces,
        updated_by=admin_user.id
    )
    
    # Return spaces information
    spaces_info = load_crud.get_spaces_info(updated_load)
    return LoadSpacesResponse(**spaces_info)

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_admin_user
from app.core.database import get_db
from app.crud.aircraft import aircraft as aircraft_crud
from app.schemas.aircraft import AircraftResponse, AircraftUpdate, AircraftCreate
from app.models.users import User
from app.models.enums import AircraftType

router = APIRouter()


#=========================#
#                         #
#   Aircraft Endpoints    #
#                         #
#=========================#

@router.get("/", response_model=List[AircraftResponse])
def list_aircraft(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    aircraft_type: AircraftType = Query(None),
    search: str = Query(None, min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all aircraft with optional filters"""
    filters = {}
    if search:
        filters['search'] = search
    if aircraft_type:
        filters['type'] = aircraft_type
    
    return aircraft_crud.get_aircraft(db, filters=filters, skip=skip, limit=limit)


@router.get("/{aircraft_id}", response_model=AircraftResponse)
def read_aircraft(
    aircraft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get aircraft by ID"""
    aircraft = aircraft_crud.get(db, id=aircraft_id)
    if not aircraft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aircraft not found"
        )
    return aircraft


#=========================#
#                         #
#   Admin Endpoints       #
#                         #
#=========================#

@router.post("/", response_model=AircraftResponse)
def create_aircraft(
    aircraft_create: AircraftCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create a new aircraft (admin only)"""
    return aircraft_crud.create(db, obj_in=aircraft_create, created_by=admin_user.id)


@router.put("/{aircraft_id}", response_model=AircraftResponse)
def update_aircraft(
    aircraft_id: int,
    aircraft_update: AircraftUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update aircraft (admin only)"""
    aircraft = aircraft_crud.get(db, id=aircraft_id)
    if not aircraft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aircraft not found"
        )
    
    return aircraft_crud.update(
        db,
        db_obj=aircraft,
        obj_in=aircraft_update,
        updated_by=admin_user.id
    )


@router.delete("/{aircraft_id}")
def delete_aircraft(
    aircraft_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Delete aircraft (admin only)"""
    aircraft = aircraft_crud.get(db, id=aircraft_id)
    if not aircraft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aircraft not found"
        )
    
    aircraft_crud.remove(db, id=aircraft_id, deleted_by=admin_user.id)
    return {"message": "Aircraft deleted successfully"}

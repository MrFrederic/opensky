from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_admin_user
from app.core.database import get_db
from app.crud.equipment import equipment as equipment_crud
from app.schemas.equipment import EquipmentResponse, EquipmentCreate, EquipmentUpdate
from app.models.base import User

router = APIRouter()


@router.get("/", response_model=List[EquipmentResponse])
def list_equipment(
    type_id: int = Query(None),
    status_id: int = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """List equipment (admin only)"""
    if type_id:
        return equipment_crud.get_by_type(db, type_id=type_id, skip=skip, limit=limit)
    elif status_id:
        return equipment_crud.get_by_status(db, status_id=status_id, skip=skip, limit=limit)
    return equipment_crud.get_multi(db, skip=skip, limit=limit)


@router.post("/", response_model=EquipmentResponse)
def create_equipment(
    equipment_data: EquipmentCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create equipment (admin only)"""
    # Check if equipment with same serial number exists
    existing = equipment_crud.get_by_serial_number(db, serial_number=equipment_data.serial_number)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment with this serial number already exists"
        )
    
    return equipment_crud.create(db, obj_in=equipment_data, created_by=admin_user.id)


@router.get("/{equipment_id}", response_model=EquipmentResponse)
def get_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get equipment by ID (admin only)"""
    equipment = equipment_crud.get(db, id=equipment_id)
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    return equipment


@router.put("/{equipment_id}", response_model=EquipmentResponse)
def update_equipment(
    equipment_id: int,
    equipment_update: EquipmentUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update equipment (admin only)"""
    equipment = equipment_crud.get(db, id=equipment_id)
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    # Check if new serial number conflicts
    if equipment_update.serial_number and equipment_update.serial_number != equipment.serial_number:
        existing = equipment_crud.get_by_serial_number(db, serial_number=equipment_update.serial_number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Equipment with this serial number already exists"
            )
    
    return equipment_crud.update(
        db,
        db_obj=equipment,
        obj_in=equipment_update,
        updated_by=admin_user.id
    )


@router.delete("/{equipment_id}")
def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Delete equipment (admin only)"""
    equipment = equipment_crud.get(db, id=equipment_id)
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    equipment_crud.remove(db, id=equipment_id)
    return {"message": "Equipment deleted successfully"}


@router.get("/available", response_model=List[EquipmentResponse])
def get_available_equipment(
    available_status_id: int = Query(..., description="ID of the 'available' status"),
    type_id: int = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get available equipment for manifesting"""
    if type_id:
        return [eq for eq in equipment_crud.get_by_type(db, type_id=type_id, skip=skip, limit=limit) 
                if eq.status_id == available_status_id]
    return equipment_crud.get_available(db, available_status_id=available_status_id, skip=skip, limit=limit)

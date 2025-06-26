from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_admin_user
from app.core.database import get_db
from app.crud.dictionaries import dictionary as dict_crud, dictionary_value as dict_value_crud
from app.schemas.dictionaries import (
    DictionaryResponse, DictionaryCreate, DictionaryUpdate,
    DictionaryValueResponse, DictionaryValueCreate, DictionaryValueUpdate
)
from app.models.base import User

router = APIRouter()


# Dictionary endpoints
@router.get("/", response_model=List[DictionaryResponse])
def list_dictionaries(
    active_only: bool = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """List dictionaries"""
    if active_only:
        return dict_crud.get_active(db, skip=skip, limit=limit)
    return dict_crud.get_multi(db, skip=skip, limit=limit)


@router.post("/", response_model=DictionaryResponse)
def create_dictionary(
    dict_data: DictionaryCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create dictionary (admin only)"""
    existing = dict_crud.get_by_name(db, name=dict_data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dictionary with this name already exists"
        )
    
    return dict_crud.create(db, obj_in=dict_data, created_by=admin_user.id)


@router.get("/{dict_id}", response_model=DictionaryResponse)
def get_dictionary(
    dict_id: int,
    db: Session = Depends(get_db)
):
    """Get dictionary by ID"""
    dictionary = dict_crud.get(db, id=dict_id)
    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )
    return dictionary


@router.put("/{dict_id}", response_model=DictionaryResponse)
def update_dictionary(
    dict_id: int,
    dict_update: DictionaryUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update dictionary (admin only)"""
    dictionary = dict_crud.get(db, id=dict_id)
    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )
    
    return dict_crud.update(
        db,
        db_obj=dictionary,
        obj_in=dict_update,
        updated_by=admin_user.id
    )


# Dictionary value endpoints
@router.get("/{dict_id}/values", response_model=List[DictionaryValueResponse])
def list_dictionary_values(
    dict_id: int,
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """List values for a dictionary"""
    return dict_value_crud.get_by_dictionary(db, dictionary_id=dict_id, active_only=active_only)


@router.get("/by-name/{dict_name}/values", response_model=List[DictionaryValueResponse])
def list_values_by_dictionary_name(
    dict_name: str,
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """List values by dictionary name"""
    return dict_value_crud.get_by_dictionary_name(db, dictionary_name=dict_name, active_only=active_only)


@router.post("/{dict_id}/values", response_model=DictionaryValueResponse)
def create_dictionary_value(
    dict_id: int,
    value_data: DictionaryValueCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create dictionary value (admin only)"""
    # Ensure the dictionary exists
    dictionary = dict_crud.get(db, id=dict_id)
    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )
    
    # Set the dictionary_id
    value_create = DictionaryValueCreate(
        dictionary_id=dict_id,
        value=value_data.value,
        is_system=value_data.is_system,
        is_active=value_data.is_active
    )
    
    return dict_value_crud.create(db, obj_in=value_create, created_by=admin_user.id)


@router.get("/values/{value_id}", response_model=DictionaryValueResponse)
def get_dictionary_value(
    value_id: int,
    db: Session = Depends(get_db)
):
    """Get dictionary value by ID"""
    value = dict_value_crud.get(db, id=value_id)
    if not value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary value not found"
        )
    return value


@router.put("/values/{value_id}", response_model=DictionaryValueResponse)
def update_dictionary_value(
    value_id: int,
    value_update: DictionaryValueUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update dictionary value (admin only)"""
    value = dict_value_crud.get(db, id=value_id)
    if not value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary value not found"
        )
    
    return dict_value_crud.update(
        db,
        db_obj=value,
        obj_in=value_update,
        updated_by=admin_user.id
    )


@router.delete("/values/{value_id}")
def delete_dictionary_value(
    value_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Delete dictionary value (admin only, only if not system)"""
    value = dict_value_crud.get(db, id=value_id)
    if not value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary value not found"
        )
    
    if value.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system values"
        )
    
    deleted = dict_value_crud.remove(db, id=value_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete value"
        )
    
    return {"message": "Dictionary value deleted successfully"}

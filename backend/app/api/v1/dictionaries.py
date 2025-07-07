from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_admin_user
from app.core.database import get_db
from app.crud.dictionaries import dictionary as dict_crud, dictionary_value as dict_value_crud
from app.schemas.dictionaries import (
    DictionaryResponse, DictionaryCreate, DictionaryUpdate,
    DictionaryValueResponse, DictionaryValueCreate, DictionaryValueUpdate,
    DictionaryValueBase
)
from app.models.base import User

router = APIRouter()


# Dictionary endpoints
@router.get("/", response_model=List[DictionaryResponse])
def get_dictionaries(
    name: Optional[str] = Query(None, description="Filter by dictionary name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_system: Optional[bool] = Query(None, description="Filter by system status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all dictionaries with filters (without values)"""
    dictionaries = dict_crud.get_dictionary(
        db,
        name=name,
        is_active=is_active,
        is_system=is_system,
        skip=skip,
        limit=limit
    )
    # Ensure we return a list even if it's a single result
    if not isinstance(dictionaries, list):
        return []
    return dictionaries


@router.post("/", response_model=DictionaryResponse)
def create_dictionary(
    dict_data: DictionaryCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create dictionary (admin only)"""
    # Check if dictionary with this name already exists
    existing = dict_crud.get_dictionary(db, name=dict_data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dictionary with this name already exists"
        )
    
    return dict_crud.create_dictionary(db, obj_in=dict_data, created_by=admin_user.id)


@router.delete("/{dict_id}")
def delete_dictionary(
    dict_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Delete dictionary (admin only) - soft delete by toggling is_active"""
    dictionary = dict_crud.get_dictionary(db, id=dict_id)
    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )
    
    deleted = dict_crud.delete_dictionary(db, id=dict_id, updated_by=admin_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete dictionary"
        )
    
    status_text = "deactivated" if not deleted.is_active else "reactivated"
    return {"message": f"Dictionary {status_text} successfully"}


@router.get("/{dict_id}", response_model=DictionaryResponse)
def get_dictionary_by_id(
    dict_id: int,
    db: Session = Depends(get_db)
):
    """Get single dictionary by ID with all its values"""
    dictionary = dict_crud.get_dictionary(db, id=dict_id)
    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )
    
    # Get all values for this dictionary (including inactive ones)
    values = dict_value_crud.get_dictionary_value(
        db,
        dictionary_id=dict_id,
        is_active=None  # Get all values, both active and inactive
    )
    
    # Add values to the dictionary response
    dictionary.values = values if isinstance(values, list) else []
    return dictionary


@router.get("/by-value/{value_id}", response_model=DictionaryResponse)
def get_dictionary_by_value_id(
    value_id: int,
    db: Session = Depends(get_db)
):
    """Get single dictionary by one of its value's ID with all its values"""
    # First get the dictionary value to find the dictionary
    value = dict_value_crud.get_dictionary_value(db, id=value_id)
    if not value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary value not found"
        )
    
    # Get the dictionary
    dictionary = dict_crud.get_dictionary(db, id=value.dictionary_id)
    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )
    
    # Get all values for this dictionary (including inactive ones)
    values = dict_value_crud.get_dictionary_value(
        db,
        dictionary_id=dictionary.id,
        is_active=None  # Get all values, both active and inactive
    )
    
    # Add values to the dictionary response
    dictionary.values = values if isinstance(values, list) else []
    return dictionary


@router.put("/{dict_id}", response_model=DictionaryResponse)
def update_dictionary(
    dict_id: int,
    dict_update: DictionaryUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update dictionary name (admin only)"""
    dictionary = dict_crud.get_dictionary(db, id=dict_id)
    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )
    
    # Check if another dictionary with this name already exists
    if dict_update.name and dict_update.name != dictionary.name:
        existing = dict_crud.get_dictionary(db, name=dict_update.name)
        if existing and existing.id != dict_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dictionary with this name already exists"
            )
    
    # Use the name from the update or keep the existing name
    name = dict_update.name if dict_update.name else dictionary.name
    updated = dict_crud.update_dictionary(db, id=dict_id, name=name, updated_by=admin_user.id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update dictionary"
        )
    
    return updated


# Dictionary value endpoints
@router.post("/{dict_id}/values", response_model=DictionaryValueResponse)
def create_dictionary_value(
    dict_id: int,
    value_data: DictionaryValueBase,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create dictionary value by dictionary ID (admin only)"""
    # Ensure the dictionary exists
    dictionary = dict_crud.get_dictionary(db, id=dict_id)
    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )
    
    # Create the dictionary value with the dictionary_id from the URL
    value_create = DictionaryValueCreate(
        dictionary_id=dict_id,
        value=value_data.value,
        is_system=value_data.is_system,
        is_active=value_data.is_active
    )
    
    return dict_value_crud.create_dictionary_value(db, obj_in=value_create, created_by=admin_user.id)


@router.delete("/values/{value_id}")
def delete_dictionary_value(
    value_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Delete dictionary value by ID (admin only) - soft delete by toggling is_active"""
    value = dict_value_crud.get_dictionary_value(db, id=value_id)
    if not value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary value not found"
        )
    
    deleted = dict_value_crud.delete_dictionary_value(db, id=value_id, updated_by=admin_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete dictionary value"
        )
    
    status_text = "deactivated" if not deleted.is_active else "reactivated"
    return {"message": f"Dictionary value {status_text} successfully"}


@router.get("/values/{value_id}", response_model=DictionaryValueResponse)
def get_dictionary_value(
    value_id: int,
    db: Session = Depends(get_db)
):
    """Get dictionary value by ID"""
    value = dict_value_crud.get_dictionary_value(db, id=value_id)
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
    existing_value = dict_value_crud.get_dictionary_value(db, id=value_id)
    if not existing_value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary value not found"
        )
    
    # Use the value from the update or keep the existing value
    value = value_update.value if value_update.value else existing_value.value
    updated = dict_value_crud.update_dictionary_value(db, id=value_id, value=value, updated_by=admin_user.id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update dictionary value"
        )
    
    return updated

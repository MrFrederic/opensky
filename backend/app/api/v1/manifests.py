from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_admin_user, get_sportsman_or_admin
from app.core.database import get_db
from app.crud.manifests import manifest as manifest_crud
from app.crud.loads import jump as jump_crud
from app.schemas.manifests import (
    ManifestResponse, ManifestCreate, ManifestUpdate, 
    ManifestApproval, ManifestDecline
)
from app.models.base import User, ManifestStatus

router = APIRouter()


@router.get("/me", response_model=List[ManifestResponse])
def get_my_manifests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's manifests"""
    return manifest_crud.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)


@router.post("/", response_model=ManifestResponse)
def create_manifest(
    manifest_data: ManifestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_sportsman_or_admin)
):
    """Create a new manifest"""
    return manifest_crud.create_with_equipment(
        db,
        obj_in=manifest_data,
        user_id=current_user.id,
        created_by=current_user.id
    )


@router.get("/{manifest_id}", response_model=ManifestResponse)
def get_manifest(
    manifest_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get manifest by ID"""
    manifest = manifest_crud.get(db, id=manifest_id)
    if not manifest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manifest not found"
        )
    
    # Users can only see their own manifests unless they're admin
    if manifest.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return manifest


@router.put("/{manifest_id}", response_model=ManifestResponse)
def update_manifest(
    manifest_id: int,
    manifest_update: ManifestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update manifest"""
    manifest = manifest_crud.get(db, id=manifest_id)
    if not manifest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manifest not found"
        )
    
    # Users can only update their own pending manifests
    if manifest.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    if manifest.status != ManifestStatus.PENDING and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update pending manifests"
        )
    
    return manifest_crud.update(
        db,
        db_obj=manifest,
        obj_in=manifest_update,
        updated_by=current_user.id
    )


@router.delete("/{manifest_id}")
def delete_manifest(
    manifest_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete manifest"""
    manifest = manifest_crud.get(db, id=manifest_id)
    if not manifest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manifest not found"
        )
    
    # Users can only delete their own pending manifests
    if manifest.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    if manifest.status != ManifestStatus.PENDING and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete pending manifests"
        )
    
    manifest_crud.remove(db, id=manifest_id)
    return {"message": "Manifest deleted successfully"}


# Admin endpoints
@router.get("/", response_model=List[ManifestResponse])
def list_manifests(
    status: ManifestStatus = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """List manifests (admin only)"""
    if status:
        return manifest_crud.get_by_status(db, status=status, skip=skip, limit=limit)
    return manifest_crud.get_multi(db, skip=skip, limit=limit)


@router.get("/pending", response_model=List[ManifestResponse])
def get_pending_manifests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get pending manifests for review (admin only)"""
    return manifest_crud.get_pending(db, skip=skip, limit=limit)


@router.post("/{manifest_id}/approve")
def approve_manifest(
    manifest_id: int,
    approval_data: ManifestApproval,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Approve manifest and create jump (admin only)"""
    manifest = manifest_crud.get(db, id=manifest_id)
    if not manifest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manifest not found"
        )
    
    if manifest.status != ManifestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only approve pending manifests"
        )
    
    # Approve the manifest
    manifest_crud.approve_manifest(db, manifest=manifest, updated_by=admin_user.id)
    
    # Create jump from manifest
    jump_crud.create_from_manifest(
        db,
        manifest_id=manifest_id,
        load_id=approval_data.load_id,
        created_by=admin_user.id
    )
    
    return {"message": "Manifest approved and jump created"}


@router.post("/{manifest_id}/decline")
def decline_manifest(
    manifest_id: int,
    decline_data: ManifestDecline,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Decline manifest (admin only)"""
    manifest = manifest_crud.get(db, id=manifest_id)
    if not manifest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manifest not found"
        )
    
    if manifest.status != ManifestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only decline pending manifests"
        )
    
    manifest_crud.decline_manifest(
        db,
        manifest=manifest,
        reason=decline_data.reason,
        updated_by=admin_user.id
    )
    
    return {"message": "Manifest declined"}

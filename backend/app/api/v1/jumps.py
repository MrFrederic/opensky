from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_admin_user
from app.core.database import get_db
from app.crud.jumps import jump as jump_crud
from app.schemas.jumps import (
    JumpResponse, 
    JumpCreate, 
    JumpUpdate, 
    JumpLoadAssignment,
    JumpLoadAssignmentResponse,
    JumpLoadRemovalResponse,
    JumpLoadRemovalRequest,
    LogbookResponse,
    LogbookJumpEntry
)
from app.models.users import User

router = APIRouter()


#=========================#
#                         #
#   Logbook Endpoints     #
#                         #
#=========================#

@router.get("/logbook", response_model=LogbookResponse)
def get_my_logbook(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    jump_type_ids: Optional[List[int]] = Query(None, description="Filter by jump type IDs"),
    aircraft_ids: Optional[List[int]] = Query(None, description="Filter by aircraft IDs"),
    is_manifested: Optional[bool] = Query(None, description="Filter by manifestation status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's jump logbook"""
    filters = {
        'jump_type_ids': jump_type_ids,
        'aircraft_ids': aircraft_ids,
    }
    
    jumps = jump_crud.get_logbook_jumps(
        db, user_id=current_user.id, filters=filters
    )
    
    logbook_entries = []
    for jump in jumps:
        aircraft_name = None
        if jump.load and jump.load.aircraft:
            aircraft_name = jump.load.aircraft.name
            
        entry = LogbookJumpEntry(
            id=jump.id,
            jump_date=jump.jump_date,
            jump_type_name=jump.jump_type.name,
            jump_type_short_name=jump.jump_type.short_name,
            aircraft_name=aircraft_name,
            comment=jump.comment
        )
        logbook_entries.append(entry)
    
    return LogbookResponse(
        jumps=logbook_entries
    )


@router.get("/logbook/{user_id}", response_model=LogbookResponse)
def get_user_logbook(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    jump_type_ids: Optional[List[int]] = Query(None, description="Filter by jump type IDs"),
    aircraft_ids: Optional[List[int]] = Query(None, description="Filter by aircraft IDs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)  # Only admin can view other users' logbooks
):
    """Get specific user's jump logbook (admin only)"""
    filters = {
        'jump_type_ids': jump_type_ids,
        'aircraft_ids': aircraft_ids
    }
    
    jumps = jump_crud.get_logbook_jumps(
        db, user_id=user_id, filters=filters
    )
    
    logbook_entries = []
    for jump in jumps:
        aircraft_name = None
        if jump.load and jump.load.aircraft:
            aircraft_name = jump.load.aircraft.name
            
        entry = LogbookJumpEntry(
            id=jump.id,
            jump_date=jump.jump_date,
            jump_type_name=jump.jump_type.name,
            jump_type_short_name=jump.jump_type.short_name,
            aircraft_name=aircraft_name,
            comment=jump.comment
        )
        logbook_entries.append(entry)
    
    return LogbookResponse(
        jumps=logbook_entries
    )


#=========================#
#                         #
#   Jump CRUD Endpoints   #
#                         #
#=========================#

@router.get("/", response_model=List[JumpResponse])
def list_jumps(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = Query(None),
    jump_type_id: Optional[int] = Query(None),
    is_manifested: Optional[bool] = Query(None),
    load_id: Optional[int] = Query(None),
    parent_jump_id: Optional[int] = Query(None),
    has_parent: Optional[bool] = Query(None),
    has_load: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all jumps with optional filters"""
    filters = {}
    if user_id is not None:
        filters['user_id'] = user_id
    if jump_type_id is not None:
        filters['jump_type_id'] = jump_type_id
    if is_manifested is not None:
        filters['is_manifested'] = is_manifested
    if load_id is not None:
        filters['load_id'] = load_id
    if parent_jump_id is not None:
        filters['parent_jump_id'] = parent_jump_id
    if has_parent is not None:
        filters['has_parent'] = has_parent
    if has_load is not None:
        filters['has_load'] = has_load
    
    return jump_crud.get_jumps(db, filters=filters, skip=skip, limit=limit)


@router.get("/{jump_id}", response_model=JumpResponse)
def read_jump(
    jump_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific jump by ID"""
    jump = jump_crud.get(db, id=jump_id)
    if jump is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jump not found"
        )
    return jump


@router.post("/", response_model=JumpResponse, status_code=status.HTTP_201_CREATED)
def create_jump(
    jump_in: JumpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new jump"""
    return jump_crud.create_jump(db, obj_in=jump_in, user_id=current_user.id)


@router.put("/{jump_id}", response_model=JumpResponse)
def update_jump(
    jump_id: int,
    jump_in: JumpUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a jump"""
    jump = jump_crud.get(db, id=jump_id)
    if jump is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jump not found"
        )
    
    # Check if trying to update load_id directly
    if jump_in.model_dump(exclude_unset=True).get('load_id') is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update load_id directly. Use load assignment endpoints."
        )
    
    return jump_crud.update_jump(
        db, db_obj=jump, obj_in=jump_in, user_id=current_user.id
    )


@router.delete("/{jump_id}")
def delete_jump(
    jump_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)  # Only admin can delete
):
    """Delete a jump"""
    jump = jump_crud.get(db, id=jump_id)
    if jump is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jump not found"
        )
    
    # Check if jump is assigned to a load
    if jump.load_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete jump that is assigned to a load. Remove from load first."
        )
    
    # Check if jump has child jumps (is a parent)
    if jump.child_jumps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete jump that has linked staff jumps. Remove from load first."
        )
    
    jump_crud.remove(db, id=jump_id)
    return {"message": "Jump deleted successfully"}


#============================#
#                            #
#   Load Management Endpoints#
#                            #
#============================#

@router.post("/{jump_id}/assign-to-load/{load_id}", response_model=JumpLoadAssignmentResponse)
def assign_jump_to_load(
    jump_id: int,
    load_id: int,
    assignment: JumpLoadAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign jump to load with required staff"""
    if assignment.jump_id != jump_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jump ID in path must match jump ID in request body"
        )
    
    result = jump_crud.assign_to_load(
        db,
        jump_id=jump_id,
        load_id=load_id,
        reserved=assignment.reserved,
        staff_assignments=assignment.staff_assignments,
        user_id=current_user.id
    )
    
    return JumpLoadAssignmentResponse(**result)


@router.post("/{jump_id}/remove-from-load", response_model=JumpLoadRemovalResponse)
def remove_jump_from_load(
    jump_id: int,
    removal_request: JumpLoadRemovalRequest = JumpLoadRemovalRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove jump from load and optionally clear staff assignments"""
    result = jump_crud.remove_from_load(
        db,
        jump_id=jump_id,
        user_id=current_user.id,
        clear_staff_assignments=removal_request.clear_staff_assignments
    )
    
    return JumpLoadRemovalResponse(**result)


@router.get("/load/{load_id}", response_model=List[JumpResponse])
def get_load_jumps(
    load_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all jumps for a specific load"""
    return jump_crud.get_load_jumps(db, load_id=load_id)

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from app.api.deps import get_current_user
from app.core.database import get_db
from app.crud.loads import load as load_crud
from app.crud.jumps import jump as jump_crud
from app.schemas.manifest import ManifestResponse, LoadSummary, JumpSummary, AdditionalStaffSummary, JumpTypeSummary
from app.models.users import User
from app.models.enums import LoadStatus

router = APIRouter()


#=========================#
#                         #
#   Manifest Endpoints    #
#                         #
#=========================#

@router.get("/", response_model=ManifestResponse)
def get_manifest_data(
    hide_old_loads: bool = Query(True, description="Hide loads from previous days"),
    aircraft_ids: Optional[List[int]] = Query(None, description="Filter by aircraft IDs"),
    load_statuses: Optional[List[LoadStatus]] = Query(None, description="Filter by load statuses"),
    selected_load_id: Optional[int] = Query(None, description="Get detailed info for specific load"),
    is_manifested: bool = Query(True, description="Filter manifested jumps"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ManifestResponse:
    """
    Get all manifest data for the manifesting page.
    
    Returns:
    - List of loads with basic information
    - Detailed information for selected load (if selected_load_id provided)
    - List of unassigned manifested jumps
    """
    
    # Build filters for loads
    load_filters = {}
    
    if hide_old_loads:
        from datetime import datetime, time
        today = date.today()
        load_filters['departure_from'] = datetime.combine(today, time.min)
        load_filters['departure_to'] = datetime.combine(today, time.max)
    
    if aircraft_ids:
        # Use the first aircraft_id for single filter (existing CRUD supports single aircraft_id)
        load_filters['aircraft_id'] = aircraft_ids[0] if len(aircraft_ids) == 1 else None
    
    if load_statuses:
        # Use the first status for single filter (existing CRUD supports single status)
        load_filters['status'] = load_statuses[0] if len(load_statuses) == 1 else None
    
    # Get loads using existing CRUD
    loads = load_crud.get_loads(db, filters=load_filters, limit=100)
    
    # If multiple aircraft_ids or statuses were provided, filter manually
    if aircraft_ids and len(aircraft_ids) > 1:
        loads = [load for load in loads if load.aircraft_id in aircraft_ids]
    
    if load_statuses and len(load_statuses) > 1:
        loads = [load for load in loads if load.status in load_statuses]
    
    # Convert loads to LoadSummary
    load_summaries = []
    for i, load_item in enumerate(loads, 1):
        load_summaries.append(LoadSummary(
            id=load_item.id,
            index_number=i,
            aircraft_name=load_item.aircraft.name,
            aircraft_id=load_item.aircraft_id,
            total_spaces=load_item.aircraft.max_load,
            remaining_public_spaces=load_item.remaining_public_spaces,
            remaining_reserved_spaces=load_item.remaining_reserved_spaces,
            departure=load_item.departure,
            status=load_item.status,
            reserved_spaces=load_item.reserved_spaces
        ))
    
    # Get selected load details if requested
    selected_load_id_result = None
    selected_load_jumps = []
    
    # If no selected_load_id provided, pick the load with the closest departure time to now
    if not selected_load_id and load_summaries:
        from datetime import datetime
        # Get timezone info from the first load's departure time
        first_departure = load_summaries[0].departure
        if hasattr(first_departure, 'tzinfo') and first_departure.tzinfo:
            now = datetime.now(tz=first_departure.tzinfo)
        else:
            now = datetime.now()
        
        closest_load = min(
            load_summaries,
            key=lambda l: abs((l.departure - now).total_seconds())
        )
        selected_load_id = closest_load.id

    if selected_load_id:
        selected_load = load_crud.get(db, selected_load_id)
        if selected_load:
            selected_load_id_result = selected_load_id
            # Get jumps for the selected load
            load_jumps = jump_crud.get_load_jumps(db, selected_load_id)
            # Convert jumps to JumpSummary
            for jump_item in load_jumps:
                # Create jump type summary with additional staff for load jumps
                jump_type_summary = None
                if jump_item.jump_type:
                    additional_staff_summaries = []
                    for staff in jump_item.jump_type.additional_staff:
                        additional_staff_summaries.append(AdditionalStaffSummary(
                            id=staff.id,
                            staff_required_role=staff.staff_required_role,
                            staff_default_jump_type_id=staff.staff_default_jump_type_id
                        ))
                    
                    jump_type_summary = JumpTypeSummary(
                        id=jump_item.jump_type.id,
                        name=jump_item.jump_type.name,
                        short_name=jump_item.jump_type.short_name,
                        additional_staff=additional_staff_summaries
                    )

                selected_load_jumps.append(JumpSummary(
                    id=jump_item.id,
                    user_id=jump_item.user_id,
                    user_name=f"{jump_item.user.first_name} {jump_item.user.last_name}",
                    jump_type_name=jump_item.jump_type.name,
                    reserved=jump_item.reserved or False,
                    parent_jump_id=jump_item.parent_jump_id,
                    load_id=jump_item.load_id,
                    staff_assignments=jump_item.staff_assignments,
                    jump_type=jump_type_summary
                ))
    
    # Get unassigned manifested jumps (parent_jump_id=None)
    jump_filters = {
        'is_manifested': is_manifested,
        'has_load': False,
        'parent_jump_id': None
    }
    
    unassigned_jumps = jump_crud.get_jumps(db, filters=jump_filters, limit=100)
    
    # Convert to JumpSummary
    unassigned_jump_summaries = []
    for jump_item in unassigned_jumps:
        # Create jump type summary with additional staff
        jump_type_summary = None
        if jump_item.jump_type:
            additional_staff_summaries = []
            for staff in jump_item.jump_type.additional_staff:
                additional_staff_summaries.append(AdditionalStaffSummary(
                    id=staff.id,
                    staff_required_role=staff.staff_required_role,
                    staff_default_jump_type_id=staff.staff_default_jump_type_id
                ))
            
            jump_type_summary = JumpTypeSummary(
                id=jump_item.jump_type.id,
                name=jump_item.jump_type.name,
                short_name=jump_item.jump_type.short_name,
                additional_staff=additional_staff_summaries
            )
        
        unassigned_jump_summaries.append(JumpSummary(
            id=jump_item.id,
            user_id=jump_item.user_id,
            user_name=f"{jump_item.user.first_name} {jump_item.user.last_name}",
            jump_type_name=jump_item.jump_type.name,
            reserved=jump_item.reserved or False,
            parent_jump_id=jump_item.parent_jump_id,
            load_id=jump_item.load_id,
            staff_assignments=jump_item.staff_assignments,
            jump_type=jump_type_summary
        ))
    
    return ManifestResponse(
        loads=load_summaries,
        selected_load=selected_load_id_result,
        selected_load_jumps=selected_load_jumps,
        unassigned_jumps=unassigned_jump_summaries
    )

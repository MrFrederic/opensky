from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from app.core.database import get_db
from app.models.loads import Load
from app.models.jumps import Jump
from app.models.enums import LoadStatus
from app.schemas.dashboard import DashboardResponse
from app.crud.loads import load as load_crud

router = APIRouter()


@router.get("/dashboard", response_model=List[DashboardResponse])
def get_dashboard(db: Session = Depends(get_db)):
    """
    Public dashboard endpoint - returns today's loads that are not older than 30 minutes.
    Limited information only: aircraft, departure, remaining public slots, status,
    and for jumps: display name, jump type short name, and parent jump id.
    """
    # Calculate the time threshold (30 minutes ago)
    thirty_minutes_ago = datetime.now() - timedelta(minutes=30)
    
    # Get today's loads that are not older than 30 minutes
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Get today's loads that are not older than 30 minutes using existing CRUD
    filters = {
        'departure_from': thirty_minutes_ago,
        'departure_to': today_end
    }
    
    loads = load_crud.get_loads(db, filters=filters)
    
    # Load jumps separately for each load to get complete jump information
    for load in loads:
        load.jumps = (
            db.query(Jump)
            .options(
                joinedload(Jump.user),
                joinedload(Jump.jump_type)
            )
            .filter(Jump.load_id == load.id)
            .all()
        )
    
    # Build dashboard response
    dashboard_data = []
    for load in loads:
        # Build jump data
        jump_data = []
        for jump in load.jumps:
            if jump.is_manifested:  # Only include manifested jumps
                # Get display name with fallback
                display_name = jump.user.display_name if jump.user.display_name else f"{jump.user.first_name} {jump.user.last_name}"
                
                jump_data.append({
                    "jump_id": jump.id,
                    "display_name": display_name,
                    "jump_type_short_name": jump.jump_type.short_name if jump.jump_type else None,
                    "parent_jump_id": jump.parent_jump_id
                })
        
        dashboard_data.append({
            "load_id": load.id,
            "aircraft_name": load.aircraft.name if load.aircraft else None,
            "departure": load.departure,
            "remaining_public_slots": getattr(load, 'remaining_public_spaces', 0),
            "status": load.status,
            "jumps": jump_data
        })
    
    return dashboard_data

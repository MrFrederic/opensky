from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_admin_user
from app.core.database import get_db
from app.crud.tandems import tandem_slot, tandem_booking
from app.schemas.tandems import (
    TandemSlotResponse, TandemSlotCreate, TandemSlotUpdate, TandemSlotAvailability,
    TandemBookingResponse, TandemBookingCreate, TandemBookingUpdate
)
from app.models.base import User, UserRole

router = APIRouter()


# Tandem slots endpoints
@router.get("/slots/availability", response_model=List[TandemSlotAvailability])
def get_slot_availability(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db)
):
    """Get tandem slot availability for date range"""
    return tandem_slot.get_available_dates(db, start_date=start_date, end_date=end_date)


@router.post("/slots", response_model=TandemSlotResponse)
def create_tandem_slot(
    slot_data: TandemSlotCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Create tandem slot (admin only)"""
    existing_slot = tandem_slot.get_by_date(db, slot_date=slot_data.slot_date)
    if existing_slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slot for this date already exists"
        )
    
    return tandem_slot.create(db, obj_in=slot_data, created_by=admin_user.id)


@router.put("/slots/{slot_date}", response_model=TandemSlotResponse)
def update_tandem_slot(
    slot_date: date,
    slot_update: TandemSlotUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Update tandem slot (admin only)"""
    slot = tandem_slot.get_by_date(db, slot_date=slot_date)
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slot not found"
        )
    
    return tandem_slot.update(
        db,
        db_obj=slot,
        obj_in=slot_update,
        updated_by=admin_user.id
    )


# Tandem bookings endpoints
@router.get("/bookings/me", response_model=List[TandemBookingResponse])
def get_my_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's tandem bookings"""
    return tandem_booking.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)


@router.post("/bookings", response_model=TandemBookingResponse)
def create_tandem_booking(
    booking_data: TandemBookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create tandem booking"""
    # Check if slots are available
    if not tandem_booking.check_availability(db, booking_date=booking_data.booking_date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No available slots for this date"
        )
    
    # Create booking with user_id
    booking_create = TandemBookingCreate(
        booking_date=booking_data.booking_date
    )
    
    # We need to manually add user_id since it's not in the schema
    booking_dict = booking_create.dict()
    booking_dict['user_id'] = current_user.id
    
    return tandem_booking.create(db, obj_in=booking_dict, created_by=current_user.id)


@router.put("/bookings/{booking_id}", response_model=TandemBookingResponse)
def update_tandem_booking(
    booking_id: int,
    booking_update: TandemBookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update tandem booking"""
    booking = tandem_booking.get(db, id=booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Users can only update their own bookings
    user_roles = [role_assignment.role for role_assignment in current_user.roles]
    if booking.user_id != current_user.id and UserRole.ADMINISTRATOR not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # If changing date, check availability
    if booking_update.booking_date and booking_update.booking_date != booking.booking_date:
        if not tandem_booking.check_availability(db, booking_date=booking_update.booking_date):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No available slots for the new date"
            )
    
    return tandem_booking.update(
        db,
        db_obj=booking,
        obj_in=booking_update,
        updated_by=current_user.id
    )


@router.delete("/bookings/{booking_id}")
def cancel_tandem_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel tandem booking"""
    booking = tandem_booking.get(db, id=booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Users can only cancel their own bookings
    user_roles = [role_assignment.role for role_assignment in current_user.roles]
    if booking.user_id != current_user.id and UserRole.ADMINISTRATOR not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Update status to cancelled instead of deleting
    from app.models.base import TandemBookingStatus
    booking_update = TandemBookingUpdate(status=TandemBookingStatus.CANCELLED)
    tandem_booking.update(
        db,
        db_obj=booking,
        obj_in=booking_update,
        updated_by=current_user.id
    )
    
    return {"message": "Booking cancelled successfully"}


# Admin endpoints
@router.get("/bookings", response_model=List[TandemBookingResponse])
def list_all_bookings(
    booking_date: date = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """List all tandem bookings (admin only)"""
    if booking_date:
        return tandem_booking.get_by_date(db, booking_date=booking_date)
    return tandem_booking.get_multi(db, skip=skip, limit=limit)

from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.crud.base import CRUDBase
from app.models.tandems import TandemSlot, TandemBooking
from app.models.base import TandemBookingStatus
from app.schemas.tandems import (
    TandemSlotCreate, TandemSlotUpdate, TandemSlotAvailability,
    TandemBookingCreate, TandemBookingUpdate
)


class CRUDTandemSlot(CRUDBase[TandemSlot, TandemSlotCreate, TandemSlotUpdate]):
    def get_by_date(self, db: Session, *, slot_date: date) -> Optional[TandemSlot]:
        """Get tandem slot by date"""
        return db.query(TandemSlot).filter(TandemSlot.slot_date == slot_date).first()

    def get_available_dates(self, db: Session, *, start_date: date, end_date: date) -> List[TandemSlotAvailability]:
        """Get dates with available slots"""
        # Query slots and count bookings for each date
        query = (
            db.query(
                TandemSlot.slot_date,
                TandemSlot.total_slots,
                func.count(TandemBooking.id).label('booked_slots')
            )
            .outerjoin(TandemBooking, 
                      (TandemSlot.slot_date == TandemBooking.booking_date) & 
                      (TandemBooking.status == TandemBookingStatus.CONFIRMED))
            .filter(TandemSlot.slot_date.between(start_date, end_date))
            .group_by(TandemSlot.slot_date, TandemSlot.total_slots)
        )
        
        results = []
        for slot_date, total_slots, booked_slots in query.all():
            available_slots = total_slots - booked_slots
            results.append(TandemSlotAvailability(
                slot_date=slot_date,
                total_slots=total_slots,
                booked_slots=booked_slots,
                available_slots=available_slots
            ))
        
        return results


class CRUDTandemBooking(CRUDBase[TandemBooking, TandemBookingCreate, TandemBookingUpdate]):
    def get_by_user(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[TandemBooking]:
        """Get bookings by user"""
        return (
            db.query(TandemBooking)
            .filter(TandemBooking.user_id == user_id)
            .order_by(TandemBooking.booking_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_date(self, db: Session, *, booking_date: date) -> List[TandemBooking]:
        """Get all bookings for a specific date"""
        return (
            db.query(TandemBooking)
            .filter(TandemBooking.booking_date == booking_date)
            .filter(TandemBooking.status == TandemBookingStatus.CONFIRMED)
            .all()
        )

    def count_bookings_for_date(self, db: Session, *, booking_date: date) -> int:
        """Count confirmed bookings for a specific date"""
        return (
            db.query(TandemBooking)
            .filter(TandemBooking.booking_date == booking_date)
            .filter(TandemBooking.status == TandemBookingStatus.CONFIRMED)
            .count()
        )

    def check_availability(self, db: Session, *, booking_date: date) -> bool:
        """Check if there are available slots for a date"""
        slot = db.query(TandemSlot).filter(TandemSlot.slot_date == booking_date).first()
        if not slot:
            return False
        
        booked_count = self.count_bookings_for_date(db, booking_date=booking_date)
        return slot.total_slots > booked_count


tandem_slot = CRUDTandemSlot(TandemSlot)
tandem_booking = CRUDTandemBooking(TandemBooking)

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import List
from app.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.room import Room
from app.services.auth import require_owner

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user=Depends(require_owner)):
    today = date.today()

    total_revenue = db.query(func.sum(Booking.total_price)).filter(
        Booking.status == BookingStatus.confirmed
    ).scalar() or 0

    active_bookings = db.query(Booking).filter(
        Booking.status == BookingStatus.confirmed,
        Booking.check_in <= today,
        Booking.check_out > today,
    ).count()

    total_bookings = db.query(Booking).filter(
        Booking.status == BookingStatus.confirmed
    ).count()

    total_rooms = db.query(Room).filter(Room.is_active == True).count()
    occupied_rooms = db.query(Booking).filter(
        Booking.status == BookingStatus.confirmed,
        Booking.check_in <= today,
        Booking.check_out > today,
    ).count()

    return {
        "total_revenue": float(total_revenue),
        "active_bookings": active_bookings,
        "total_bookings": total_bookings,
        "total_rooms": total_rooms,
        "occupied_rooms": min(occupied_rooms, total_rooms),
        "available_rooms": max(total_rooms - occupied_rooms, 0),
    }


@router.get("/occupancy")
def get_occupancy(
    period: str = Query("week", pattern="^(week|month|year)$"),
    db: Session = Depends(get_db),
    current_user=Depends(require_owner),
):
    today = date.today()

    if period == "year":
        results = []
        for m in range(11, -1, -1):
            # first day of each of the last 12 months
            month_date = (today.replace(day=1) - timedelta(days=m * 28)).replace(day=1)
            next_month = (month_date.replace(day=28) + timedelta(days=4)).replace(day=1)
            revenue = db.query(func.sum(Booking.total_price)).filter(
                Booking.status == BookingStatus.confirmed,
                Booking.check_in >= month_date,
                Booking.check_in < next_month,
            ).scalar() or 0
            bookings = db.query(Booking).filter(
                Booking.status == BookingStatus.confirmed,
                Booking.check_in >= month_date,
                Booking.check_in < next_month,
            ).count()
            results.append({
                "date": str(month_date),
                "occupied": bookings,
                "revenue": float(revenue),
            })
        return results

    if period == "week":
        start = today - timedelta(days=6)
    else:
        start = today - timedelta(days=29)

    results = []
    current = start
    while current <= today:
        count = db.query(Booking).filter(
            Booking.status == BookingStatus.confirmed,
            Booking.check_in <= current,
            Booking.check_out > current,
        ).count()

        revenue = db.query(func.sum(Booking.total_price)).filter(
            Booking.status == BookingStatus.confirmed,
            Booking.check_in == current,
        ).scalar() or 0

        results.append({
            "date": str(current),
            "occupied": count,
            "revenue": float(revenue),
        })
        current += timedelta(days=1)

    return results

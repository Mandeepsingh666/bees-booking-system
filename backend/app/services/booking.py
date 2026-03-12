from datetime import date
from decimal import Decimal
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status


def check_availability(db: Session, room_id: int, check_in: date, check_out: date,
                        exclude_booking_id: Optional[int] = None) -> bool:
    """Returns True if room is available for the given dates."""
    from app.models.booking import Booking, BookingStatus
    query = db.query(Booking).filter(
        Booking.room_id == room_id,
        Booking.status == BookingStatus.confirmed,
        Booking.check_in < check_out,
        Booking.check_out > check_in,
    )
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)
    return query.first() is None


def validate_promo(db: Session, code: str, today: date):
    """Validate and return a PromoCode, or raise HTTPException."""
    from app.models.promo_code import PromoCode
    promo = db.query(PromoCode).filter(
        PromoCode.code == code.upper(),
        PromoCode.is_active == True,
    ).first()
    if not promo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid promo code")
    if promo.expiry_date < today:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Promo code has expired")
    if promo.usage_limit is not None and promo.times_used >= promo.usage_limit:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Promo code usage limit reached")
    return promo


def calculate_total(nights: int, price_per_night: Decimal, promo=None) -> Tuple[Decimal, Decimal]:
    """Returns (discount_amount, total_price)."""
    from app.models.promo_code import DiscountType
    subtotal = Decimal(str(nights)) * Decimal(str(price_per_night))
    discount = Decimal("0")

    if promo:
        if promo.discount_type == DiscountType.percentage:
            discount = subtotal * (Decimal(str(promo.discount_value)) / Decimal("100"))
        else:
            discount = Decimal(str(promo.discount_value))
        discount = min(discount, subtotal)  # cap discount at subtotal

    total = subtotal - discount
    return discount.quantize(Decimal("0.01")), total.quantize(Decimal("0.01"))

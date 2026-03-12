from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from app.models.booking import PaymentMethod, BookingStatus
from app.schemas.room import RoomOut
from app.schemas.user import UserOut


class BookingCreate(BaseModel):
    guest_name: str
    guest_email: EmailStr
    guest_phone: str
    room_id: int
    check_in: date
    check_out: date
    num_guests: int = 1
    payment_method: PaymentMethod
    promo_code: Optional[str] = None


class BookingUpdate(BaseModel):
    guest_name: Optional[str] = None
    guest_email: Optional[EmailStr] = None
    guest_phone: Optional[str] = None
    num_guests: Optional[int] = None
    payment_method: Optional[PaymentMethod] = None


class CancelRequest(BaseModel):
    reason: str


class BookingOut(BaseModel):
    id: int
    guest_name: str
    guest_email: str
    guest_phone: str
    room_id: int
    employee_id: int
    check_in: date
    check_out: date
    num_guests: int
    payment_method: PaymentMethod
    promo_code_id: Optional[int]
    discount_applied: Decimal
    total_price: Decimal
    status: BookingStatus
    cancellation_reason: Optional[str]
    guest_id_image_path: Optional[str]
    created_at: datetime
    room: Optional[RoomOut] = None
    employee: Optional[UserOut] = None

    class Config:
        from_attributes = True

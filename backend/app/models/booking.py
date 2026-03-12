from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"


class BookingStatus(str, enum.Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    guest_name = Column(String(150), nullable=False)
    guest_email = Column(String(100), nullable=False)
    guest_phone = Column(String(30), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    num_guests = Column(Integer, nullable=False, default=1)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    promo_code_id = Column(Integer, ForeignKey("promo_codes.id"), nullable=True)
    discount_applied = Column(Numeric(12, 2), default=0)
    total_price = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.confirmed)
    cancellation_reason = Column(Text, nullable=True)
    guest_id_image_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    room = relationship("Room", back_populates="bookings")
    employee = relationship("User", back_populates="bookings", foreign_keys=[employee_id])
    promo_code = relationship("PromoCode", back_populates="bookings")
    invoice = relationship("Invoice", back_populates="booking", uselist=False)

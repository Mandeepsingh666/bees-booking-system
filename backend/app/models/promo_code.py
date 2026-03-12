from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class DiscountType(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_type = Column(Enum(DiscountType), nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False)
    expiry_date = Column(Date, nullable=False)
    usage_limit = Column(Integer, nullable=True)  # null = unlimited
    times_used = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    bookings = relationship("Booking", back_populates="promo_code")

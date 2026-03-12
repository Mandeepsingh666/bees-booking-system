from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal
from app.models.promo_code import DiscountType


class PromoCodeCreate(BaseModel):
    code: str
    discount_type: DiscountType
    discount_value: Decimal
    expiry_date: date
    usage_limit: Optional[int] = None
    is_active: bool = True


class PromoCodeOut(BaseModel):
    id: int
    code: str
    discount_type: DiscountType
    discount_value: Decimal
    expiry_date: date
    usage_limit: Optional[int]
    times_used: int
    is_active: bool

    class Config:
        from_attributes = True


class PromoValidateRequest(BaseModel):
    code: str
    check_in: date
    check_out: date
    room_id: int


class PromoValidateResponse(BaseModel):
    valid: bool
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    message: str

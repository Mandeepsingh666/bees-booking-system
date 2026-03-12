from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal


class RoomCreate(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    price_per_night: Decimal
    capacity: int = 2
    amenities: Optional[str] = None
    is_active: bool = True


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    price_per_night: Optional[Decimal] = None
    capacity: Optional[int] = None
    amenities: Optional[str] = None
    is_active: Optional[bool] = None


class RoomOut(BaseModel):
    id: int
    name: str
    type: str
    description: Optional[str]
    price_per_night: Decimal
    capacity: int
    amenities: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

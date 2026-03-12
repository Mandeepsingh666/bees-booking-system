from sqlalchemy import Column, Integer, String, Numeric, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # Standard, Deluxe, Penthouse
    description = Column(Text, nullable=True)
    price_per_night = Column(Numeric(12, 2), nullable=False)
    capacity = Column(Integer, nullable=False, default=2)
    amenities = Column(Text, nullable=True)  # newline-separated list
    is_active = Column(Boolean, default=True)

    bookings = relationship("Booking", back_populates="room")

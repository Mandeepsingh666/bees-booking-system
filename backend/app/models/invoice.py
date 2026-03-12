from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    pdf_path = Column(String(500), nullable=False)

    booking = relationship("Booking", back_populates="invoice")

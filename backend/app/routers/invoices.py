from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
import os
from app.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.invoice import Invoice
from app.models.room import Room
from app.schemas.invoice import InvoiceOut
from app.services.auth import get_current_user
from app.services.pdf import generate_invoice_pdf
from app.services import email as email_svc
from app.config import settings

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.post("/{booking_id}/generate", response_model=InvoiceOut)
def generate_invoice(booking_id: int, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.room), joinedload(Booking.promo_code))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == BookingStatus.cancelled:
        raise HTTPException(status_code=400, detail="Cannot generate invoice for cancelled booking")

    room = booking.room
    pdf_path = generate_invoice_pdf(booking, room, booking.promo_code)

    # Upsert invoice record
    invoice = db.query(Invoice).filter(Invoice.booking_id == booking_id).first()
    if invoice:
        invoice.pdf_path = pdf_path
    else:
        invoice = Invoice(booking_id=booking_id, pdf_path=pdf_path)
        db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # Email to guest
    email_svc.send_email(
        to=booking.guest_email,
        subject=f"Your Invoice #{booking.id} — Shelbee's Suites",
        body=email_svc.booking_confirmation_guest(
            booking.guest_name, booking.id, room.name,
            str(booking.check_in), str(booking.check_out),
            f"{float(booking.total_price):,.2f}", booking.payment_method.value
        ),
        attachment_path=pdf_path,
    )

    return InvoiceOut(
        id=invoice.id,
        booking_id=invoice.booking_id,
        issued_at=invoice.issued_at,
        pdf_path=invoice.pdf_path,
        download_url=f"/api/invoices/{booking_id}/download",
    )


@router.get("/{booking_id}/download")
def download_invoice(booking_id: int, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.booking_id == booking_id).first()
    if not invoice or not os.path.exists(invoice.pdf_path):
        raise HTTPException(status_code=404, detail="Invoice PDF not found. Generate it first.")
    return FileResponse(
        invoice.pdf_path,
        media_type="application/pdf",
        filename=f"shelbees-suites-invoice-{booking_id}.pdf",
    )

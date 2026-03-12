import os
import uuid
from datetime import date
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.room import Room
from app.models.promo_code import PromoCode
from app.models.invoice import Invoice
from app.schemas.booking import BookingCreate, BookingUpdate, BookingOut, CancelRequest
from app.services.auth import get_current_user
from app.services.booking import check_availability, validate_promo, calculate_total
from app.services import email as email_svc
from app.services.pdf import generate_invoice_pdf
from app.config import settings

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def _load_booking(db: Session, booking_id: int) -> Booking:
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.room), joinedload(Booking.employee), joinedload(Booking.promo_code))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.get("", response_model=List[BookingOut])
def list_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    guest_name: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Booking).options(joinedload(Booking.room), joinedload(Booking.employee))
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    if guest_name:
        query = query.filter(Booking.guest_name.ilike(f"%{guest_name}%"))
    if date_from:
        query = query.filter(Booking.check_in >= date_from)
    if date_to:
        query = query.filter(Booking.check_out <= date_to)
    return query.order_by(Booking.created_at.desc()).all()


def _post_booking_tasks(booking_id: int, room_name: str, room_type: str,
                         guest_email: str, guest_name: str, check_in: str,
                         check_out: str, total: float, payment_method: str,
                         employee_name: str, promo_code_obj, db: Session):
    """Run PDF generation and emails in background after booking is saved."""
    from app.database import SessionLocal
    bg_db = SessionLocal()
    try:
        booking = _load_booking(bg_db, booking_id)
        room = bg_db.query(Room).filter(Room.id == booking.room_id).first()
        pdf_path = generate_invoice_pdf(booking, room, promo_code_obj)
        invoice = Invoice(booking_id=booking_id, pdf_path=pdf_path)
        bg_db.add(invoice)
        bg_db.commit()

        email_svc.send_email(
            to=guest_email,
            subject=f"Booking Confirmation #{booking_id} — Shelbee's Suites",
            body=email_svc.booking_confirmation_guest(
                guest_name, booking_id, room_name,
                check_in, check_out, f"{total:,.2f}", payment_method
            ),
            attachment_path=pdf_path,
        )

        if settings.OWNER_EMAIL:
            email_svc.send_email(
                to=settings.OWNER_EMAIL,
                subject=f"New Booking #{booking_id} — {guest_name}",
                body=email_svc.booking_alert_owner(
                    guest_name, booking_id, room_name,
                    check_in, check_out, f"{total:,.2f}", employee_name
                ),
            )
    except Exception as e:
        print(f"[POST-BOOKING] Error: {e}")
    finally:
        bg_db.close()


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(body: BookingCreate, background_tasks: BackgroundTasks,
                   db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if body.check_out <= body.check_in:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")

    room = db.query(Room).filter(Room.id == body.room_id, Room.is_active == True).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found or inactive")

    if not check_availability(db, body.room_id, body.check_in, body.check_out):
        raise HTTPException(status_code=409, detail="Room is not available for the selected dates")

    promo = None
    if body.promo_code:
        promo = validate_promo(db, body.promo_code, date.today())

    nights = (body.check_out - body.check_in).days
    discount, total = calculate_total(nights, room.price_per_night, promo)

    booking = Booking(
        guest_name=body.guest_name,
        guest_email=body.guest_email,
        guest_phone=body.guest_phone,
        room_id=body.room_id,
        employee_id=current_user.id,
        check_in=body.check_in,
        check_out=body.check_out,
        num_guests=body.num_guests,
        payment_method=body.payment_method,
        promo_code_id=promo.id if promo else None,
        discount_applied=discount,
        total_price=total,
        status=BookingStatus.confirmed,
    )
    db.add(booking)

    if promo:
        promo.times_used += 1

    db.commit()
    db.refresh(booking)

    background_tasks.add_task(
        _post_booking_tasks,
        booking.id, room.name, room.type,
        booking.guest_email, booking.guest_name,
        str(booking.check_in), str(booking.check_out),
        float(total), booking.payment_method.value,
        current_user.username, promo, db,
    )

    return _load_booking(db, booking.id)


@router.get("/today", response_model=dict)
def today_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    today = date.today()
    check_ins = db.query(Booking).filter(
        Booking.check_in == today, Booking.status == BookingStatus.confirmed
    ).count()
    check_outs = db.query(Booking).filter(
        Booking.check_out == today, Booking.status == BookingStatus.confirmed
    ).count()
    occupied = db.query(Booking).filter(
        Booking.status == BookingStatus.confirmed,
        Booking.check_in <= today,
        Booking.check_out > today,
    ).count()
    total_rooms = db.query(Room).filter(Room.is_active == True).count()
    return {"check_ins": check_ins, "check_outs": check_outs,
            "occupied": occupied, "total_rooms": total_rooms}


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: int, db: Session = Depends(get_db),
                current_user=Depends(get_current_user)):
    return _load_booking(db, booking_id)


@router.put("/{booking_id}", response_model=BookingOut)
def update_booking(booking_id: int, body: BookingUpdate, db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):
    booking = _load_booking(db, booking_id)
    if booking.status == BookingStatus.cancelled:
        raise HTTPException(status_code=400, detail="Cannot edit a cancelled booking")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)
    db.commit()
    return _load_booking(db, booking_id)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, body: CancelRequest, db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):
    booking = _load_booking(db, booking_id)
    if booking.status == BookingStatus.cancelled:
        raise HTTPException(status_code=400, detail="Booking already cancelled")
    booking.status = BookingStatus.cancelled
    booking.cancellation_reason = body.reason
    db.commit()
    db.refresh(booking)

    room = db.query(Room).filter(Room.id == booking.room_id).first()
    try:
        email_svc.send_email(
            to=booking.guest_email,
            subject=f"Booking Cancellation #{booking.id} — Shelbee's Suites",
            body=email_svc.cancellation_guest(
                booking.guest_name, booking.id, room.name if room else "N/A",
                str(booking.check_in), body.reason
            ),
        )
        if settings.OWNER_EMAIL:
            email_svc.send_email(
                to=settings.OWNER_EMAIL,
                subject=f"Booking #{booking.id} Cancelled — {booking.guest_name}",
                body=email_svc.cancellation_alert_owner(
                    booking.guest_name, booking.id, room.name if room else "N/A",
                    str(booking.check_in), body.reason, current_user.username
                ),
            )
    except Exception as e:
        print(f"[CANCEL EMAIL] Error: {e}")

    return _load_booking(db, booking_id)


@router.post("/{booking_id}/upload-id", response_model=BookingOut)
async def upload_guest_id(booking_id: int, file: UploadFile = File(...),
                           db: Session = Depends(get_db),
                           current_user=Depends(get_current_user)):
    booking = _load_booking(db, booking_id)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".pdf", ".webp"}:
        raise HTTPException(status_code=400, detail="Invalid file type. Use JPG, PNG, PDF or WebP.")

    filename = f"guest_id_{booking_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)

    booking.guest_id_image_path = filepath
    db.commit()
    return _load_booking(db, booking_id)


@router.get("/{booking_id}/id-image")
def get_guest_id_image(booking_id: int, db: Session = Depends(get_db),
                        current_user=Depends(get_current_user)):
    booking = _load_booking(db, booking_id)
    if not booking.guest_id_image_path or not os.path.exists(booking.guest_id_image_path):
        raise HTTPException(status_code=404, detail="No ID image found")
    return FileResponse(booking.guest_id_image_path)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
from app.models.promo_code import PromoCode
from app.schemas.promo_code import PromoCodeCreate, PromoCodeOut, PromoValidateRequest, PromoValidateResponse
from app.services.auth import get_current_user, require_owner
from app.services.booking import validate_promo, calculate_total

router = APIRouter(prefix="/api/promo-codes", tags=["promo-codes"])


@router.get("", response_model=List[PromoCodeOut])
def list_promo_codes(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(PromoCode).order_by(PromoCode.id.desc()).all()


@router.post("", response_model=PromoCodeOut, status_code=status.HTTP_201_CREATED)
def create_promo_code(body: PromoCodeCreate, db: Session = Depends(get_db),
                      current_user=Depends(require_owner)):
    existing = db.query(PromoCode).filter(PromoCode.code == body.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Promo code already exists")
    promo = PromoCode(**{**body.model_dump(), "code": body.code.upper()})
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


@router.put("/{promo_id}/deactivate", response_model=PromoCodeOut)
def deactivate_promo(promo_id: int, db: Session = Depends(get_db),
                     current_user=Depends(require_owner)):
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found")
    promo.is_active = False
    db.commit()
    db.refresh(promo)
    return promo


@router.post("/validate", response_model=PromoValidateResponse)
def validate_code(body: PromoValidateRequest, db: Session = Depends(get_db),
                  current_user=Depends(get_current_user)):
    try:
        from app.models.room import Room
        promo = validate_promo(db, body.code, date.today())
        room = db.query(Room).filter(Room.id == body.room_id).first()
        if not room:
            return PromoValidateResponse(valid=False, message="Room not found")
        nights = (body.check_out - body.check_in).days
        discount, total = calculate_total(nights, room.price_per_night, promo)
        return PromoValidateResponse(
            valid=True,
            discount_type=promo.discount_type.value,
            discount_value=promo.discount_value,
            message=f"Code applied! You save GYD ${discount:,.2f}",
        )
    except HTTPException as e:
        return PromoValidateResponse(valid=False, message=e.detail)

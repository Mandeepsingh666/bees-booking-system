from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserOut
from app.services.auth import hash_password, require_owner

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("", response_model=List[UserOut])
def list_employees(db: Session = Depends(get_db), current_user=Depends(require_owner)):
    return db.query(User).filter(User.role == UserRole.employee).order_by(User.created_at.desc()).all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_employee(body: UserCreate, db: Session = Depends(get_db),
                    current_user=Depends(require_owner)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already in use")
    employee = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=UserRole.employee,
        is_active=True,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.put("/{employee_id}/deactivate", response_model=UserOut)
def deactivate_employee(employee_id: int, db: Session = Depends(get_db),
                         current_user=Depends(require_owner)):
    employee = db.query(User).filter(User.id == employee_id, User.role == UserRole.employee).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    employee.is_active = False
    db.commit()
    db.refresh(employee)
    return employee


@router.put("/{employee_id}/activate", response_model=UserOut)
def activate_employee(employee_id: int, db: Session = Depends(get_db),
                       current_user=Depends(require_owner)):
    employee = db.query(User).filter(User.id == employee_id, User.role == UserRole.employee).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    employee.is_active = True
    db.commit()
    db.refresh(employee)
    return employee

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os, shutil, uuid
from app.database import get_db
from app.models.maintenance import MaintenanceIssue, Priority, IssueStatus
from app.models.user import User
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceOut
from app.services.auth import get_current_user
from app.services import email as email_svc
from app.config import settings

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


def _to_out(issue: MaintenanceIssue) -> MaintenanceOut:
    return MaintenanceOut(
        id=issue.id,
        location=issue.location,
        description=issue.description,
        priority=issue.priority,
        status=issue.status,
        reported_by=issue.reported_by,
        created_at=issue.created_at,
        updated_at=issue.updated_at,
        reporter_name=issue.reporter.username if issue.reporter else None,
        image_path=issue.image_path,
    )


@router.get("", response_model=List[MaintenanceOut])
def list_issues(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(MaintenanceIssue).options(joinedload(MaintenanceIssue.reporter))
    if status_filter:
        query = query.filter(MaintenanceIssue.status == status_filter)
    if priority_filter:
        query = query.filter(MaintenanceIssue.priority == priority_filter)
    issues = query.order_by(MaintenanceIssue.created_at.desc()).all()
    return [_to_out(i) for i in issues]


@router.post("", response_model=MaintenanceOut, status_code=status.HTTP_201_CREATED)
def create_issue(body: MaintenanceCreate, db: Session = Depends(get_db),
                 current_user=Depends(get_current_user)):
    issue = MaintenanceIssue(
        location=body.location,
        description=body.description,
        priority=body.priority,
        status=IssueStatus.open,
        reported_by=current_user.id,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)

    # Eager load reporter
    issue = db.query(MaintenanceIssue).options(
        joinedload(MaintenanceIssue.reporter)
    ).filter(MaintenanceIssue.id == issue.id).first()

    # Email owner for urgent issues
    if body.priority == Priority.urgent and settings.OWNER_EMAIL:
        try:
            email_svc.send_email(
                to=settings.OWNER_EMAIL,
                subject=f"URGENT Maintenance Issue #{issue.id} — {body.location}",
                body=email_svc.maintenance_alert_owner(
                    body.location, body.description, body.priority.value,
                    current_user.username, issue.id
                ),
            )
        except Exception as e:
            print(f"[MAINTENANCE EMAIL] {e}")

    return _to_out(issue)


@router.get("/{issue_id}", response_model=MaintenanceOut)
def get_issue(issue_id: int, db: Session = Depends(get_db),
              current_user=Depends(get_current_user)):
    issue = db.query(MaintenanceIssue).options(
        joinedload(MaintenanceIssue.reporter)
    ).filter(MaintenanceIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return _to_out(issue)


@router.put("/{issue_id}", response_model=MaintenanceOut)
def update_issue(issue_id: int, body: MaintenanceUpdate, db: Session = Depends(get_db),
                 current_user=Depends(get_current_user)):
    issue = db.query(MaintenanceIssue).options(
        joinedload(MaintenanceIssue.reporter)
    ).filter(MaintenanceIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(issue, field, value)
    db.commit()
    db.refresh(issue)
    # Reload with reporter
    issue = db.query(MaintenanceIssue).options(
        joinedload(MaintenanceIssue.reporter)
    ).filter(MaintenanceIssue.id == issue_id).first()
    return _to_out(issue)


@router.post("/{issue_id}/upload-image", response_model=MaintenanceOut)
def upload_image(issue_id: int, file: UploadFile = File(...),
                 db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    issue = db.query(MaintenanceIssue).options(
        joinedload(MaintenanceIssue.reporter)
    ).filter(MaintenanceIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    filename = f"maintenance_{issue_id}_{uuid.uuid4().hex[:8]}{ext}"
    path = os.path.join(upload_dir, filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    issue.image_path = path
    db.commit()
    issue = db.query(MaintenanceIssue).options(
        joinedload(MaintenanceIssue.reporter)
    ).filter(MaintenanceIssue.id == issue_id).first()
    return _to_out(issue)


@router.get("/{issue_id}/image")
def view_image(issue_id: int, db: Session = Depends(get_db),
               current_user=Depends(get_current_user)):
    issue = db.query(MaintenanceIssue).filter(MaintenanceIssue.id == issue_id).first()
    if not issue or not issue.image_path or not os.path.exists(issue.image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(issue.image_path)

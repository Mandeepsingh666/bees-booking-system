from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.maintenance import Priority, IssueStatus


class MaintenanceCreate(BaseModel):
    location: str
    description: str
    priority: Priority = Priority.medium


class MaintenanceUpdate(BaseModel):
    status: Optional[IssueStatus] = None
    priority: Optional[Priority] = None
    description: Optional[str] = None


class MaintenanceOut(BaseModel):
    id: int
    location: str
    description: str
    priority: Priority
    status: IssueStatus
    reported_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    reporter_name: Optional[str] = None
    image_path: Optional[str] = None

    class Config:
        from_attributes = True

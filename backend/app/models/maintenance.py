from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    urgent = "urgent"


class IssueStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"


class MaintenanceIssue(Base):
    __tablename__ = "maintenance_issues"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Enum(Priority), nullable=False, default=Priority.medium)
    status = Column(Enum(IssueStatus), nullable=False, default=IssueStatus.open)
    reported_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    reporter = relationship("User", back_populates="maintenance_issues")

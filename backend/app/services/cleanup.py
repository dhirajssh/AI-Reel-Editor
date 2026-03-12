from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.project import Project
from app.services.storage import StorageService


def cleanup_expired_guest_projects(db: Session) -> int:
    storage = StorageService()
    expired_projects = (
        db.query(Project)
        .filter(Project.guest_session_id.is_not(None))
        .filter(Project.expires_at.is_not(None))
        .filter(Project.expires_at < datetime.now(UTC))
        .all()
    )
    for project in expired_projects:
        storage.cleanup_project_files(project.id)
        db.delete(project)
    db.commit()
    return len(expired_projects)


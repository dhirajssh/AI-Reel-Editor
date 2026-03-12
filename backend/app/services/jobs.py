from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.job import Job


class JobService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_job(self, job_id: int) -> Job:
        job = self.db.query(Job).filter(Job.id == job_id).first()
        if job is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        return job

    def update_status(self, job_id: int, status_value: str, progress_message: str | None = None, error_message: str | None = None) -> Job:
        job = self.get_job(job_id)
        job.status = status_value
        job.progress_message = progress_message
        job.error_message = error_message
        if status_value in {"completed", "failed"}:
            job.completed_at = datetime.now(UTC)
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job


from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, UploadFile, status
from slugify import slugify
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.job import Job
from app.models.project import Project
from app.models.transcript import Transcript
from app.services.ffmpeg import probe_duration
from app.services.ownership import RequestOwner, assert_project_access
from app.services.storage import StorageService


class ProjectService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()
        self.storage = StorageService()

    def create_project(self, title: str, owner: RequestOwner) -> Project:
        normalized_title = slugify(title) or "untitled-project"
        project = Project(
            title=normalized_title,
            original_filename="pending",
            original_file_path="pending",
            status="queued",
            user_id=owner.user.id if owner.user else None,
            guest_session_id=owner.guest_session_id if owner.is_guest else None,
            expires_at=(
                datetime.now(UTC) + timedelta(hours=self.settings.guest_project_ttl_hours)
                if owner.is_guest
                else None
            ),
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def upload_project_video(self, project_id: int, upload: UploadFile, owner: RequestOwner) -> tuple[Project, Job]:
        project = self._get_owned_project(project_id, owner)
        if not upload.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing filename")
        self._validate_extension(upload.filename)
        self._validate_upload_size(upload)

        path = self.storage.save_upload(project_id, upload)
        duration = probe_duration(path)
        if duration > self.settings.max_duration_seconds:
            self.storage.cleanup_project_files(project_id)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Video exceeds max duration")

        project.original_filename = upload.filename
        project.original_file_path = path
        project.status = "queued"
        job = Job(project_id=project.id, status="queued", progress_message="uploaded")
        self.db.add(job)
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        self.db.refresh(job)
        return project, job

    def list_projects(self, owner: RequestOwner) -> list[Project]:
        query = self.db.query(Project)
        if owner.user:
            query = query.filter(Project.user_id == owner.user.id)
        else:
            query = query.filter(Project.guest_session_id == owner.guest_session_id)
        return query.order_by(Project.created_at.desc()).all()

    def get_project(self, project_id: int, owner: RequestOwner) -> Project:
        project = self._get_owned_project(project_id, owner)
        project.latest_job = project.jobs[-1] if project.jobs else None
        return project

    def delete_project(self, project_id: int, owner: RequestOwner) -> None:
        project = self._get_owned_project(project_id, owner)
        self.storage.cleanup_project_files(project.id)
        self.db.delete(project)
        self.db.commit()

    def attach_guest_projects(self, guest_session_id: str, owner: RequestOwner) -> int:
        if not owner.user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Login required")
        projects = self.db.query(Project).filter(Project.guest_session_id == guest_session_id).all()
        for project in projects:
            project.user_id = owner.user.id
            project.guest_session_id = None
            project.expires_at = None
            self.db.add(project)
        self.db.commit()
        return len(projects)

    def upsert_transcript(self, project_id: int, full_text: str, words: list[dict], segments: list[dict]) -> Transcript:
        transcript = self.db.query(Transcript).filter(Transcript.project_id == project_id).first()
        if transcript is None:
            transcript = Transcript(
                project_id=project_id,
                full_text=full_text,
                word_timestamps_json=words,
                caption_segments_json=segments,
            )
            self.db.add(transcript)
        else:
            transcript.full_text = full_text
            transcript.word_timestamps_json = words
            transcript.caption_segments_json = segments
        self.db.commit()
        self.db.refresh(transcript)
        return transcript

    def _get_owned_project(self, project_id: int, owner: RequestOwner) -> Project:
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        assert_project_access(owner, project)
        return project

    @staticmethod
    def _validate_extension(filename: str) -> None:
        allowed = {".mp4", ".mov", ".webm"}
        extension = "." + filename.lower().split(".")[-1]
        if extension not in allowed:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    def _validate_upload_size(self, upload: UploadFile) -> None:
        upload.file.seek(0, 2)
        size_bytes = upload.file.tell()
        upload.file.seek(0)
        if size_bytes > self.settings.max_upload_size_mb * 1024 * 1024:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Video exceeds max file size")

from __future__ import annotations

import logging

from app.db.session import session_scope
from app.media.rendering import build_ass_file, extract_audio, normalize_to_vertical, render_final_video
from app.media.transcription import WhisperXService
from app.models.job import Job
from app.models.project import Project
from app.services.captioning import segment_words
from app.services.cleanup import cleanup_expired_guest_projects
from app.services.jobs import JobService
from app.services.projects import ProjectService
from app.services.storage import StorageService
from app.tasks.celery_app import celery_app


logger = logging.getLogger(__name__)


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=5, retry_kwargs={"max_retries": 2})
def process_project_video(self, project_id: int, job_id: int) -> None:
    storage = StorageService()
    with session_scope() as db:
        jobs = JobService(db)
        project_service = ProjectService(db)
        jobs.update_status(job_id, "processing", "extracting audio")

        project = db.query(Project).filter(Project.id == project_id).first()
        if project is None:
            raise RuntimeError(f"Project {project_id} not found")

        try:
            normalized_path = storage.normalized_video_path(project_id)
            audio_path = storage.audio_path(project_id)
            captions_path = storage.captions_ass_path(project_id)
            output_path = storage.output_path(project_id)

            project.status = "processing"
            db.add(project)
            db.commit()

            jobs.update_status(job_id, "processing", "normalizing video")
            normalize_to_vertical(project.original_file_path, normalized_path)

            jobs.update_status(job_id, "processing", "extracting audio")
            extract_audio(normalized_path, audio_path)

            jobs.update_status(job_id, "processing", "transcribing")
            transcript_payload = WhisperXService().transcribe(audio_path)

            jobs.update_status(job_id, "processing", "generating captions")
            segments = segment_words(transcript_payload["words"])
            project_service.upsert_transcript(project_id, transcript_payload["text"], transcript_payload["words"], segments)
            build_ass_file(captions_path, segments)

            jobs.update_status(job_id, "processing", "rendering video")
            render_final_video(normalized_path, captions_path, output_path)

            project.processed_file_path = output_path
            project.status = "completed"
            db.add(project)
            db.commit()
            jobs.update_status(job_id, "completed", "completed")
        except Exception as exc:
            logger.exception("Video processing failed for project %s", project_id)
            project.status = "failed"
            db.add(project)
            db.commit()
            jobs.update_status(job_id, "failed", "failed", str(exc))
            raise


@celery_app.task
def cleanup_guest_projects_task() -> int:
    with session_scope() as db:
        return cleanup_expired_guest_projects(db)

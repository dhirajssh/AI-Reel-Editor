from celery import Celery

from app.core.config import get_settings


settings = get_settings()

celery_app = Celery("video_tasks", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
)

# Import task modules so Celery registers application tasks in both worker and API processes.
import app.tasks.video_tasks  # noqa: E402,F401

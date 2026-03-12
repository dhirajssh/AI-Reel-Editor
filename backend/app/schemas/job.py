from datetime import datetime

from app.schemas.common import ORMModel


class JobResponse(ORMModel):
    id: int
    project_id: int
    status: str
    progress_message: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None


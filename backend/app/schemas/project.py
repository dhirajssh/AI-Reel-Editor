from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class WordTimestamp(BaseModel):
    word: str
    start: float
    end: float


class CaptionSegment(BaseModel):
    line_start: float
    line_end: float
    text: str
    words: list[WordTimestamp]


class ProjectCreateRequest(BaseModel):
    title: str


class AttachGuestRequest(BaseModel):
    guest_session_id: str


class ProjectResponse(ORMModel):
    id: int
    user_id: int | None
    guest_session_id: str | None
    title: str
    original_filename: str
    original_file_path: str
    processed_file_path: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    expires_at: datetime | None


class TranscriptResponse(ORMModel):
    id: int
    full_text: str
    word_timestamps_json: list[dict]
    caption_segments_json: list[dict]
    created_at: datetime


class ProjectDetailResponse(ProjectResponse):
    transcript: TranscriptResponse | None = None
    latest_job: "JobResponse | None" = None


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]


from app.schemas.job import JobResponse  # noqa: E402

ProjectDetailResponse.model_rebuild()


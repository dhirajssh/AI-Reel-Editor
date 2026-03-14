from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI Reel Captioning and Intro Zoom Editor"
    app_env: str = "development"
    api_prefix: str = "/api"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/reel_captioning"
    redis_url: str = "redis://localhost:6379/0"
    storage_root: str = "storage"
    max_upload_size_mb: int = 300
    max_duration_seconds: int = 300
    guest_project_ttl_hours: int = 24
    whisperx_model: str = "small"
    asr_backend: str = "auto"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000", "http://localhost:3001"])
    ffmpeg_bin: str = "ffmpeg"
    ffprobe_bin: str = "ffprobe"
    jwt_secret_key: str = "dev-secret-change-in-production"
    jwt_expiry_hours: int = 24


@lru_cache
def get_settings() -> Settings:
    return Settings()

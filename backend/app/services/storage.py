from __future__ import annotations

import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.root = Path(self.settings.storage_root)
        self.root.mkdir(parents=True, exist_ok=True)

    def project_dir(self, project_id: int) -> Path:
        path = self.root / f"project_{project_id}"
        path.mkdir(parents=True, exist_ok=True)
        return path

    def save_upload(self, project_id: int, upload: UploadFile) -> str:
        project_dir = self.project_dir(project_id)
        suffix = Path(upload.filename or "upload.mp4").suffix or ".mp4"
        path = project_dir / f"original_{uuid4().hex}{suffix}"
        with path.open("wb") as buffer:
            shutil.copyfileobj(upload.file, buffer)
        return str(path)

    def output_path(self, project_id: int) -> str:
        return str(self.project_dir(project_id) / "final_reel.mp4")

    def audio_path(self, project_id: int) -> str:
        return str(self.project_dir(project_id) / "audio.wav")

    def normalized_video_path(self, project_id: int) -> str:
        return str(self.project_dir(project_id) / "normalized_vertical.mp4")

    def captions_ass_path(self, project_id: int) -> str:
        return str(self.project_dir(project_id) / "captions.ass")

    def cleanup_intermediate_files(self, project_id: int) -> None:
        """Delete non-final processing artifacts to reduce disk usage."""
        project_dir = self.root / f"project_{project_id}"
        if not project_dir.exists():
            return

        for filename in ("audio.wav", "normalized_vertical.mp4", "captions.ass"):
            path = project_dir / filename
            if path.exists():
                path.unlink()

    def cleanup_project_files(self, project_id: int) -> None:
        project_dir = self.root / f"project_{project_id}"
        if project_dir.exists():
            shutil.rmtree(project_dir)

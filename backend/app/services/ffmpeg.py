from __future__ import annotations

import json
import subprocess

from app.core.config import get_settings


settings = get_settings()


def run_ffmpeg(command: list[str]) -> None:
    ffmpeg_command = [settings.ffmpeg_bin, *command[1:]] if command and command[0] == "ffmpeg" else command
    result = subprocess.run(ffmpeg_command, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "FFmpeg command failed")


def probe_duration(input_path: str) -> float:
    result = subprocess.run(
        [
            settings.ffprobe_bin,
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            input_path,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "ffprobe failed")
    payload = json.loads(result.stdout)
    return float(payload["format"]["duration"])

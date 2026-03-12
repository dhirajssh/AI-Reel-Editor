from __future__ import annotations


def seconds_to_ass_time(value: float) -> str:
    hours = int(value // 3600)
    minutes = int((value % 3600) // 60)
    seconds = int(value % 60)
    centiseconds = int(round((value - int(value)) * 100))
    return f"{hours}:{minutes:02d}:{seconds:02d}.{centiseconds:02d}"


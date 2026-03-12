from __future__ import annotations

from typing import Iterable


PUNCTUATION_BREAKS = {".", "!", "?", ",", ";", ":"}


def segment_words(words: Iterable[dict], max_words_per_line: int = 6, min_duration: float = 1.0) -> list[dict]:
    segments: list[dict] = []
    current: list[dict] = []

    for word in words:
        current.append(word)
        has_break = any(char in PUNCTUATION_BREAKS for char in word["word"])
        duration = current[-1]["end"] - current[0]["start"]
        if len(current) >= max_words_per_line or (has_break and duration >= min_duration):
            segments.append(_build_segment(current))
            current = []

    if current:
        segments.append(_build_segment(current))

    return _merge_short_segments(segments, min_duration=min_duration)


def _build_segment(words: list[dict]) -> dict:
    return {
        "line_start": words[0]["start"],
        "line_end": words[-1]["end"],
        "text": " ".join(word["word"] for word in words),
        "words": words,
    }


def _merge_short_segments(segments: list[dict], min_duration: float) -> list[dict]:
    if not segments:
        return []

    merged: list[dict] = [segments[0]]
    for segment in segments[1:]:
        last = merged[-1]
        if (last["line_end"] - last["line_start"]) < min_duration:
            combined_words = last["words"] + segment["words"]
            merged[-1] = _build_segment(combined_words)
        else:
            merged.append(segment)
    return merged


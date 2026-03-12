from __future__ import annotations

import os
import ssl
from typing import Any

from app.core.config import get_settings


class WhisperXService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._configure_model_download_env()

    def transcribe(self, audio_path: str) -> dict[str, Any]:
        try:
            import whisperx
        except ImportError as exc:
            raise RuntimeError("WhisperX is not installed in this environment") from exc

        model = whisperx.load_model(self.settings.whisperx_model, device="cpu", compute_type="int8")
        result = model.transcribe(audio_path, batch_size=8)
        align_model, metadata = whisperx.load_align_model(language_code=result["language"], device="cpu")
        aligned = whisperx.align(result["segments"], align_model, metadata, audio_path, device="cpu")
        aligned_words = self._extract_aligned_words(aligned.get("segments", []))
        fallback_words = self._interpolate_words_from_segments(result.get("segments", []))

        if fallback_words and len(aligned_words) < max(2, int(len(fallback_words) * 0.6)):
            words = fallback_words
        else:
            words = aligned_words or fallback_words

        full_text = result.get("text", "").strip() or " ".join(word["word"] for word in words)
        return {
            "text": full_text,
            "words": words,
        }

    @staticmethod
    def _extract_aligned_words(segments: list[dict]) -> list[dict]:
        words: list[dict] = []
        for segment in segments:
            for word in segment.get("words", []):
                value = (word.get("word") or "").strip()
                if not value:
                    continue
                if "start" not in word or "end" not in word:
                    continue
                start = float(word["start"])
                end = float(word["end"])
                if end <= start:
                    continue
                words.append({"word": value, "start": start, "end": end})
        return words

    @staticmethod
    def _interpolate_words_from_segments(segments: list[dict]) -> list[dict]:
        words: list[dict] = []
        for segment in segments:
            text = (segment.get("text") or "").strip()
            if not text:
                continue
            tokens = [token.strip() for token in text.split() if token.strip()]
            if not tokens:
                continue
            start = float(segment.get("start") or 0.0)
            end = float(segment.get("end") or start)
            if end <= start:
                continue
            step = (end - start) / len(tokens)
            for index, token in enumerate(tokens):
                token_start = start + (index * step)
                token_end = end if index == len(tokens) - 1 else start + ((index + 1) * step)
                words.append(
                    {
                        "word": token,
                        "start": token_start,
                        "end": token_end,
                    }
                )
        return words

    @staticmethod
    def _configure_model_download_env() -> None:
        try:
            import certifi
        except ImportError:
            certifi_path = None
        else:
            certifi_path = certifi.where()

        if certifi_path:
            os.environ.setdefault("SSL_CERT_FILE", certifi_path)
            os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi_path)
            os.environ.setdefault("CURL_CA_BUNDLE", certifi_path)
            ssl._create_default_https_context = lambda: ssl.create_default_context(cafile=certifi_path)

        # Xet-backed range requests have been flaky in this environment during first-run model downloads.
        os.environ.setdefault("HF_HUB_DISABLE_XET", "1")

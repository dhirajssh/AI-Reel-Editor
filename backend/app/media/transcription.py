from __future__ import annotations

import logging
import os
import ssl
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class WhisperXService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._configure_model_download_env()

    def transcribe(self, audio_path: str) -> dict[str, Any]:
        backend_choice = (self.settings.asr_backend or "auto").strip().lower()
        if backend_choice == "transformers":
            logger.info("ASR backend override active: transformers")
            return self._transcribe_with_transformers(audio_path)

        whisperx_error: Exception | None = None
        try:
            return self._transcribe_with_whisperx(audio_path)
        except Exception as exc:  # pragma: no cover - runtime fallback path
            whisperx_error = exc
            logger.exception("WhisperX transcription failed, falling back to Transformers Whisper")

        try:
            return self._transcribe_with_transformers(audio_path)
        except Exception as fallback_exc:
            if whisperx_error is None:
                raise
            raise RuntimeError(
                f"WhisperX failed ({whisperx_error!r}) and fallback ASR failed ({fallback_exc!r})"
            ) from fallback_exc

    def _transcribe_with_whisperx(self, audio_path: str) -> dict[str, Any]:
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

    def _transcribe_with_transformers(self, audio_path: str) -> dict[str, Any]:
        from transformers import pipeline

        model_name = self._resolve_transformers_model_name(self.settings.whisperx_model)
        asr = pipeline(
            "automatic-speech-recognition",
            model=model_name,
            chunk_length_s=20,
            device=-1,
        )

        word_result = asr(audio_path, return_timestamps="word")
        words = self._extract_words_from_chunks(word_result.get("chunks", []))
        full_text = (word_result.get("text") or "").strip()

        if not words:
            segment_result = asr(audio_path, return_timestamps=True)
            segments = self._extract_segments_from_chunks(segment_result.get("chunks", []))
            words = self._interpolate_words_from_segments(segments)
            if not full_text:
                full_text = (segment_result.get("text") or "").strip()

        if not full_text:
            full_text = " ".join(word["word"] for word in words)

        return {
            "text": full_text,
            "words": words,
        }

    @staticmethod
    def _resolve_transformers_model_name(model_hint: str) -> str:
        name = (model_hint or "base").strip().lower()
        if "/" in name:
            return name

        alias_map = {
            "tiny": "openai/whisper-tiny",
            "tiny.en": "openai/whisper-tiny.en",
            "base": "openai/whisper-base",
            "base.en": "openai/whisper-base.en",
            "small": "openai/whisper-small",
            "small.en": "openai/whisper-small.en",
            "medium": "openai/whisper-medium",
            "medium.en": "openai/whisper-medium.en",
            "large": "openai/whisper-large-v3",
            "large-v2": "openai/whisper-large-v2",
            "large-v3": "openai/whisper-large-v3",
        }
        return alias_map.get(name, "openai/whisper-base")

    @staticmethod
    def _extract_words_from_chunks(chunks: list[dict]) -> list[dict]:
        words: list[dict] = []
        for chunk in chunks:
            value = (chunk.get("text") or "").strip()
            timestamp = chunk.get("timestamp")
            if not value or not isinstance(timestamp, (list, tuple)) or len(timestamp) != 2:
                continue

            start, end = timestamp
            if start is None or end is None:
                continue

            start_f = float(start)
            end_f = float(end)
            if end_f <= start_f:
                continue

            words.append(
                {
                    "word": value,
                    "start": start_f,
                    "end": end_f,
                }
            )
        return words

    @staticmethod
    def _extract_segments_from_chunks(chunks: list[dict]) -> list[dict]:
        segments: list[dict] = []
        for chunk in chunks:
            text = (chunk.get("text") or "").strip()
            timestamp = chunk.get("timestamp")
            if not text or not isinstance(timestamp, (list, tuple)) or len(timestamp) != 2:
                continue
            start, end = timestamp
            if start is None or end is None:
                continue
            start_f = float(start)
            end_f = float(end)
            if end_f <= start_f:
                continue
            segments.append(
                {
                    "text": text,
                    "start": start_f,
                    "end": end_f,
                }
            )
        return segments

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

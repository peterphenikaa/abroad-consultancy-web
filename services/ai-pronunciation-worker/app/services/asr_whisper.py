"""Stage 1: ASR via faster-whisper (Whisper v3 family)."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING

from app.config import Settings
from app.schemas import AsrSegment

if TYPE_CHECKING:
    from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

_model_cache: WhisperModel | None = None


def _get_model(settings: Settings) -> WhisperModel:
    global _model_cache
    if _model_cache is not None:
        return _model_cache
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:
        raise RuntimeError(
            "Chưa cài faster-whisper. Thêm vào requirements và pip install."
        ) from e

    _model_cache = WhisperModel(
        settings.whisper_model,
        device=settings.whisper_device,
        compute_type=settings.whisper_compute_type,
    )
    return _model_cache


async def transcribe_audio(
    settings: Settings,
    wav_path: Path,
    *,
    language: str = "en",
) -> tuple[str, list[AsrSegment]]:
    """
    Returns (full_hypothesis_text, word-level-ish segments from Whisper).
    """
    model = _get_model(settings)
    segments_iter, _info = model.transcribe(
        str(wav_path),
        language=language,
        word_timestamps=True,
        vad_filter=True,
    )

    parts: list[str] = []
    out_segments: list[AsrSegment] = []

    for seg in segments_iter:
        text = (seg.text or "").strip()
        if text:
            parts.append(text)
        if seg.words:
            for w in seg.words:
                word = (w.word or "").strip()
                if word:
                    out_segments.append(
                        AsrSegment(
                            text=word,
                            start_s=float(w.start),
                            end_s=float(w.end),
                        )
                    )
        elif text:
            out_segments.append(
                AsrSegment(
                    text=text,
                    start_s=float(seg.start),
                    end_s=float(seg.end),
                )
            )

    hypothesis = " ".join(parts).strip()
    logger.info("ASR hypothesis (%d chars, %d segments)", len(hypothesis), len(out_segments))
    return hypothesis, out_segments

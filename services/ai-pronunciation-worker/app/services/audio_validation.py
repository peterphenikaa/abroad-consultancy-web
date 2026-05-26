"""Validate uploaded audio: format, size, duration (paper: 5–120s)."""

from __future__ import annotations

import io
import tempfile
from pathlib import Path

from app.config import Settings

_SUPPORTED_SUFFIXES = {".wav", ".webm", ".mp3", ".ogg", ".m4a", ".flac"}


def validate_audio_bytes(settings: Settings, data: bytes, filename: str) -> tuple[float, Path]:
    """
    Returns (duration_seconds, path_to_temp_wav_or_original).
    Raises ValueError on invalid input.
    """
    if not data:
        raise ValueError("File âm thanh trống.")
    if len(data) > settings.audio_max_bytes:
        raise ValueError(
            f"File quá lớn (max {settings.audio_max_bytes // 1_000_000} MB)."
        )

    suffix = Path(filename or "audio.wav").suffix.lower()
    if suffix and suffix not in _SUPPORTED_SUFFIXES:
        raise ValueError(
            f"Định dạng không hỗ trợ: {suffix}. Dùng {', '.join(sorted(_SUPPORTED_SUFFIXES))}."
        )

    try:
        from pydub import AudioSegment
    except ImportError as e:
        raise RuntimeError(
            "Thiếu pydub/ffmpeg — cài pydub và ffmpeg trên PATH để đọc audio."
        ) from e

    fmt = suffix.lstrip(".") if suffix else "wav"
    if fmt == "webm":
        fmt = "webm"

    try:
        seg = AudioSegment.from_file(io.BytesIO(data), format=fmt)
    except Exception as e:
        raise ValueError(f"Không đọc được file audio: {e}") from e

    duration_s = len(seg) / 1000.0
    if duration_s < settings.audio_min_duration_s:
        raise ValueError(
            f"Audio quá ngắn ({duration_s:.1f}s). Tối thiểu {settings.audio_min_duration_s}s."
        )
    if duration_s > settings.audio_max_duration_s:
        raise ValueError(
            f"Audio quá dài ({duration_s:.1f}s). Tối đa {settings.audio_max_duration_s}s."
        )

    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()
    seg.export(str(tmp_path), format="wav")
    return duration_s, tmp_path

"""Prosody: exp(-(1/T) Σ ||f0(t) - f̂0(t)||²) — paper §1.6 (MVP: F0 variance proxy)."""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)


def compute_prosody_score(wav_path: Path) -> float:
    """
    MVP: không có reference pitch contour → dùng độ ổn định F0 + phạm vi động.
    Phase 3: so sánh với TTS native / HMM contour chuẩn hóa.
    Returns score ∈ (0, 1].
    """
    try:
        import librosa
    except ImportError:
        logger.warning("librosa not installed — prosody default 0.5")
        return 0.5

    try:
        y, sr = librosa.load(str(wav_path), sr=16000, mono=True)
        f0, voiced_flag, _ = librosa.pyin(
            y,
            fmin=float(librosa.note_to_hz("C2")),
            fmax=float(librosa.note_to_hz("C7")),
            sr=sr,
        )
        if voiced_flag is not None:
            f0_voiced = f0[voiced_flag]
        else:
            f0_voiced = f0[~np.isnan(f0)]
        if len(f0_voiced) < 10:
            return 0.45

        f0_voiced = f0_voiced.astype(float)
        log_f0 = np.log(np.clip(f0_voiced, 1.0, None))
        std = float(np.std(log_f0))
        # Moderate variation ≈ natural prosody; flat or chaotic extremes penalised
        if std < 0.08:
            raw = 0.55
        elif std > 0.45:
            raw = 0.50
        else:
            raw = 0.65 + (std - 0.08) * 0.8
        return float(np.clip(raw, 0.3, 0.95))
    except Exception as e:
        logger.warning("Prosody analysis failed: %s", e)
        return 0.5


def prosody_to_band(score: float) -> float:
    return round(max(4.0, min(9.0, 4.0 + score * 5.0)), 1)

"""Gộp 4 chiều → band_overall CAM_EDU 0–9."""

from __future__ import annotations

import math

from app.schemas import PronunciationDimensions


def round_ielts_band(x: float) -> float:
    # floor(x*2+0.5) tránh lỗi float (vd. 6.25*2 → 12.499… → round → 6.0)
    return math.floor(x * 2 + 0.5) / 2


def fuse_bands(
    dimensions: PronunciationDimensions,
    *,
    has_phoneme_accuracy: bool = False,
) -> float:
    w_wer = 0.30
    w_fluency = 0.25
    w_prosody = 0.20
    w_complete = 0.15
    w_pa = 0.10

    total = (
        w_wer * dimensions.wer.band
        + w_fluency * dimensions.fluency.band
        + w_prosody * dimensions.prosody.band
        + w_complete * dimensions.completeness.band
    )
    weight_sum = w_wer + w_fluency + w_prosody + w_complete

    if has_phoneme_accuracy and dimensions.phoneme_accuracy is not None:
        total += w_pa * dimensions.phoneme_accuracy.band
        weight_sum += w_pa
    else:
        # Redistribute PA weight to WER when MFA off
        total += w_pa * dimensions.wer.band
        weight_sum += w_pa

    return round_ielts_band(total / weight_sum)

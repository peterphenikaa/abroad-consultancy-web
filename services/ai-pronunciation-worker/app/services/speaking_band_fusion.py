"""Gộp 4 tiêu chí IELTS Speaking → band_overall."""

from __future__ import annotations

from app.schemas import PronunciationDimensions, SpeakingRubric
from app.services.score_fusion import round_ielts_band


def acoustic_pronunciation_band(dimensions: PronunciationDimensions) -> float:
    """Band phát âm từ metrics acoustic (WER, prosody, fluency WPM)."""
    return round_ielts_band(
        dimensions.wer.band * 0.35
        + dimensions.prosody.band * 0.35
        + dimensions.fluency.band * 0.30
    )


def speaking_band_overall(rubric: SpeakingRubric) -> float:
    return round_ielts_band(
        (
            rubric.fluency_and_coherence
            + rubric.lexical_resource
            + rubric.grammatical_range_and_accuracy
            + rubric.pronunciation
        )
        / 4.0
    )

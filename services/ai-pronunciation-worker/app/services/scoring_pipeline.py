"""
APS orchestrator — 4 stage pipeline (paper §1.2).

Stage 1: ASR (Whisper)
Stage 2: Align (MFA) — optional
Stage 3: Score (WER, PA, Prosody, Fluency, Completeness)
Stage 4: Feedback (LLM)
"""

from __future__ import annotations

import logging
import os

from app.config import Settings
from app.schemas import (
    CefrLevel,
    DimensionScore,
    PronunciationDimensions,
    PronunciationScoreResponse,
    ScoringSource,
    TargetAccent,
)
from app.services.align_mfa import align_phonemes
from app.services.asr_whisper import transcribe_audio
from app.services.audio_validation import validate_audio_bytes
from app.services.feedback_llm import generate_feedback_vi
from app.services.metrics_completeness import (
    completeness_to_band,
    compute_completeness_ratio,
)
from app.services.metrics_fluency import compute_wpm, wpm_to_band
from app.services.metrics_phoneme import (
    compute_phoneme_accuracy,
    load_vi_phoneme_weights,
    pa_to_band,
)
from app.services.metrics_prosody import compute_prosody_score, prosody_to_band
from app.services.metrics_wer import compute_wer, wer_to_band
from app.services.score_fusion import fuse_bands
from app.services.word_errors import build_word_errors

logger = logging.getLogger(__name__)


async def score_pronunciation(
    settings: Settings,
    *,
    audio_bytes: bytes,
    filename: str,
    reference_transcript: str,
    cefr_level: CefrLevel,
    target_accent: TargetAccent,
    pronunciation_score_history: list[float],
) -> PronunciationScoreResponse:
    reference = reference_transcript.strip()
    if not reference:
        raise ValueError("reference_transcript không được trống.")

    duration_s, wav_path = validate_audio_bytes(settings, audio_bytes, filename)
    scoring_debug: dict[str, object] | None = None
    fallback_reason: str | None = None
    source: ScoringSource = "pipeline_v1"

    try:
        # --- Stage 1: ASR ---
        try:
            hypothesis, segments = await transcribe_audio(settings, wav_path)
        except Exception as e:
            logger.exception("ASR failed")
            source = "heuristic"
            fallback_reason = f"ASR (Whisper) lỗi: {e}"
            hypothesis = ""
            segments = []

        # --- Stage 2: MFA (optional) ---
        pa_value: float | None = None
        align_rows = await align_phonemes(settings, wav_path, reference)
        if align_rows:
            expected = [r[0] for r in align_rows]
            observed = [r[1] for r in align_rows]
            weights = load_vi_phoneme_weights(settings.vi_phoneme_weights_path)
            pa_value = compute_phoneme_accuracy(expected, observed, weights)

        # --- Stage 3: Metrics ---
        wer = compute_wer(reference, hypothesis)
        wpm = compute_wpm(hypothesis, duration_s)
        comp_ratio = compute_completeness_ratio(reference, hypothesis)
        prosody_raw = compute_prosody_score(wav_path)

        dimensions = PronunciationDimensions(
            wer=DimensionScore(value=round(wer, 4), band=wer_to_band(wer)),
            fluency=DimensionScore(
                value=round(wpm, 1),
                band=wpm_to_band(wpm, cefr_level),
            ),
            prosody=DimensionScore(
                value=round(prosody_raw, 4),
                band=prosody_to_band(prosody_raw),
            ),
            completeness=DimensionScore(
                value=round(comp_ratio, 4),
                band=completeness_to_band(comp_ratio),
            ),
            phoneme_accuracy=(
                DimensionScore(value=round(pa_value, 4), band=pa_to_band(pa_value))
                if pa_value is not None
                else None
            ),
        )

        band = fuse_bands(
            dimensions,
            has_phoneme_accuracy=pa_value is not None,
        )
        word_errors = build_word_errors(reference, hypothesis, segments)

        # --- Stage 4: Feedback ---
        feedback_vi, fb_fail = await generate_feedback_vi(
            settings,
            reference_transcript=reference,
            hypothesis_transcript=hypothesis,
            cefr_level=cefr_level,
            dimensions=dimensions,
            word_errors=word_errors,
            score_history=pronunciation_score_history,
        )
        if fb_fail and not fallback_reason:
            fallback_reason = fb_fail

        if settings.aps_debug_scoring:
            scoring_debug = {
                "duration_s": duration_s,
                "target_accent": target_accent,
                "whisper_model": settings.whisper_model,
                "mfa_enabled": settings.mfa_enabled,
                "wer": wer,
                "wpm": wpm,
                "completeness": comp_ratio,
                "prosody_raw": prosody_raw,
                "pa": pa_value,
            }

        return PronunciationScoreResponse(
            band_overall=band,
            scoring_source=source,
            dimensions=dimensions,
            hypothesis_transcript=hypothesis,
            reference_transcript=reference,
            word_errors=word_errors,
            feedback_vi=feedback_vi,
            audio_duration_s=round(duration_s, 2),
            scoring_debug=scoring_debug if settings.aps_debug_scoring else None,
            scoring_fallback_reason=fallback_reason,
        )
    finally:
        try:
            os.unlink(wav_path)
        except OSError:
            pass

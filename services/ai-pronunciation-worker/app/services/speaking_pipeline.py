"""
ASS orchestrator — IELTS Speaking 4 criteria + acoustic pronunciation (APS metrics).
"""

from __future__ import annotations

import logging
import os

from app.config import Settings
from app.schemas import (
    CefrLevel,
    DimensionScore,
    PronunciationDimensions,
    SpeakingImprovementSuggestion,
    SpeakingPart,
    SpeakingRubric,
    SpeakingScoreResponse,
    SpeakingScoringSource,
    TargetAccent,
)
from app.services.align_mfa import align_phonemes
from app.services.asr_whisper import transcribe_audio
from app.services.audio_validation import validate_audio_bytes
from app.services.feedback_llm import generate_feedback_vi
from app.services.gemini_speaking_rubric import score_speaking_with_gemini
from app.services.metrics_completeness import (
    completeness_to_band,
    compute_completeness_ratio,
)
from app.services.metrics_fluency import compute_wpm, wpm_to_band
from app.services.metrics_fluency_advanced import (
    compute_fluency_signals,
    fluency_signals_to_fc_anchor,
)
from app.services.metrics_grammar_heuristic import (
    compute_grammar_signals,
    grammar_signals_to_gra_anchor,
)
from app.services.metrics_lexical import compute_ttr, ttr_to_lr_anchor, word_count
from app.services.metrics_relevance import prompt_relevance_ratio
from app.services.metrics_phoneme import (
    compute_phoneme_accuracy,
    load_vi_phoneme_weights,
    pa_to_band,
)
from app.services.metrics_prosody import compute_prosody_score, prosody_to_band
from app.services.metrics_wer import compute_wer, wer_to_band
from app.services.speaking_band_fusion import (
    acoustic_pronunciation_band,
    speaking_band_overall,
)
from app.services.speaking_heuristic import (
    heuristic_improvement_suggestions,
    heuristic_speaking_rubric,
)
from app.services.word_errors import build_word_errors

logger = logging.getLogger(__name__)


async def score_speaking(
    settings: Settings,
    *,
    audio_bytes: bytes,
    filename: str,
    prompt_text: str,
    cefr_level: CefrLevel,
    target_accent: TargetAccent,
    speaking_part: SpeakingPart | None,
    reference_transcript: str | None,
    speaking_score_history: list[float],
) -> SpeakingScoreResponse:
    prompt = prompt_text.strip()
    if not prompt:
        raise ValueError("prompt_text không được trống.")

    reference = (reference_transcript or "").strip()
    duration_s, wav_path = validate_audio_bytes(settings, audio_bytes, filename)
    scoring_debug: dict[str, object] | None = None
    fallback_reason: str | None = None
    source: SpeakingScoringSource = "pipeline_v1"
    suggestions: list[SpeakingImprovementSuggestion] = []

    try:
        try:
            hypothesis, segments = await transcribe_audio(settings, wav_path)
        except Exception as e:
            logger.exception("ASR failed (ASS)")
            source = "heuristic"
            fallback_reason = f"ASR (Whisper) lỗi: {e}"
            hypothesis = ""
            segments = []

        align_ref = reference or prompt
        pa_value: float | None = None
        align_rows = await align_phonemes(settings, wav_path, align_ref)
        if align_rows and reference:
            expected = [r[0] for r in align_rows]
            observed = [r[1] for r in align_rows]
            weights = load_vi_phoneme_weights(settings.vi_phoneme_weights_path)
            pa_value = compute_phoneme_accuracy(expected, observed, weights)

        if reference:
            wer = compute_wer(reference, hypothesis)
            comp_ratio = compute_completeness_ratio(reference, hypothesis)
        else:
            wer = 0.0 if hypothesis else 1.0
            comp_ratio = 1.0 if word_count(hypothesis) >= 10 else 0.5

        wpm = compute_wpm(hypothesis, duration_s)
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

        p_acoustic = acoustic_pronunciation_band(dimensions)
        wc = word_count(hypothesis)
        ttr = compute_ttr(hypothesis)
        lr_anchor = ttr_to_lr_anchor(ttr, wc)

        fluency_sig = compute_fluency_signals(segments, hypothesis, duration_s)
        is_shadowing = speaking_part == "shadowing" or bool(reference)
        relevance = (
            prompt_relevance_ratio(prompt, hypothesis)
            if not is_shadowing
            else comp_ratio
        )
        fc_anchor = fluency_signals_to_fc_anchor(
            wpm_band=dimensions.fluency.band,
            completeness_band=dimensions.completeness.band,
            signals=fluency_sig,
            relevance_ratio=relevance,
            word_count=wc,
            speaking_part=speaking_part,
            is_shadowing=is_shadowing,
        )
        grammar_sig = compute_grammar_signals(hypothesis)
        gra_anchor = grammar_signals_to_gra_anchor(
            grammar_sig,
            cefr=cefr_level,
            wer_band=dimensions.wer.band,
            is_shadowing=is_shadowing,
            word_count=wc,
        )

        gem, gem_fail = await score_speaking_with_gemini(
            settings,
            prompt_text=prompt,
            hypothesis_transcript=hypothesis,
            reference_transcript=reference or None,
            cefr_level=cefr_level,
            speaking_part=speaking_part,
            score_history=speaking_score_history,
            dimensions=dimensions,
            pronunciation_acoustic_band=p_acoustic,
            ttr=ttr,
            lr_anchor=lr_anchor,
            fc_anchor=fc_anchor,
            gra_anchor=gra_anchor,
            word_count=wc,
            audio_duration_s=duration_s,
            pause_ratio=fluency_sig.pause_ratio,
            fillers_per_100_words=fluency_sig.fillers_per_100_words,
            relevance_ratio=relevance,
            wav_path=wav_path,
        )

        word_errors = (
            build_word_errors(reference, hypothesis, segments) if reference else []
        )

        if gem:
            rubric = SpeakingRubric(
                fluency_and_coherence=gem.fluency_and_coherence,
                lexical_resource=gem.lexical_resource,
                grammatical_range_and_accuracy=gem.grammatical_range_and_accuracy,
                pronunciation=gem.pronunciation,
            )
            suggestions = gem.improvement_suggestions
        else:
            source = "heuristic"
            if gem_fail:
                fallback_reason = gem_fail
            rubric = heuristic_speaking_rubric(
                dimensions,
                lr_anchor=lr_anchor,
                fc_anchor=fc_anchor,
                gra_anchor=gra_anchor,
            )
            suggestions = heuristic_improvement_suggestions(
                hypothesis=hypothesis,
                word_errors=word_errors,
                fluency=fluency_sig,
                grammar=grammar_sig,
            )

        band = speaking_band_overall(rubric)

        feedback_vi, fb_fail = await generate_feedback_vi(
            settings,
            reference_transcript=reference or prompt,
            hypothesis_transcript=hypothesis,
            cefr_level=cefr_level,
            dimensions=dimensions,
            word_errors=word_errors,
            score_history=speaking_score_history,
        )
        if fb_fail and not fallback_reason:
            fallback_reason = fb_fail

        if settings.aps_debug_scoring:
            scoring_debug = {
                "duration_s": duration_s,
                "speaking_part": speaking_part,
                "target_accent": target_accent,
                "wer": wer,
                "wpm": wpm,
                "completeness": comp_ratio,
                "prosody_raw": prosody_raw,
                "pa": pa_value,
                "ttr": ttr,
                "lr_anchor": lr_anchor,
                "fc_anchor": fc_anchor,
                "gra_anchor": gra_anchor,
                "pause_ratio": fluency_sig.pause_ratio,
                "fillers_per_100": fluency_sig.fillers_per_100_words,
                "relevance_ratio": relevance,
                "pronunciation_acoustic": p_acoustic,
            }

        return SpeakingScoreResponse(
            band_overall=band,
            scoring_source=source,
            speaking_rubric=rubric,
            pronunciation_dimensions=dimensions,
            hypothesis_transcript=hypothesis,
            prompt_text=prompt,
            reference_transcript=reference or None,
            speaking_part=speaking_part,
            word_errors=word_errors,
            feedback_vi=feedback_vi,
            improvement_suggestions=suggestions,
            audio_duration_s=round(duration_s, 2),
            scoring_debug=scoring_debug if settings.aps_debug_scoring else None,
            scoring_fallback_reason=fallback_reason,
        )
    finally:
        try:
            os.unlink(wav_path)
        except OSError:
            pass

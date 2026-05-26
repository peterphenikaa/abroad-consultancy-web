"""Gemini IELTS Speaking rubric — FC, LR, GRA, Pronunciation (+ audio multimodal)."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

from app.config import Settings
from app.schemas import CefrLevel, PronunciationDimensions, SpeakingImprovementSuggestion, SpeakingPart
from app.services.score_fusion import round_ielts_band

logger = logging.getLogger(__name__)

_JSON_BLOCK = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)


@dataclass
class GeminiSpeakingRubricResult:
    fluency_and_coherence: float
    lexical_resource: float
    grammatical_range_and_accuracy: float
    pronunciation: float
    improvement_suggestions: list[SpeakingImprovementSuggestion]
    parse_meta: dict[str, Any] | None = None


def _build_prompt(
    *,
    prompt_text: str,
    hypothesis_transcript: str,
    reference_transcript: str | None,
    cefr_level: CefrLevel,
    speaking_part: SpeakingPart | None,
    score_history: list[float],
    dimensions: PronunciationDimensions,
    pronunciation_acoustic_band: float,
    ttr: float,
    lr_anchor: float,
    fc_anchor: float,
    gra_anchor: float,
    word_count: int,
    audio_duration_s: float,
    pause_ratio: float,
    fillers_per_100_words: float,
    relevance_ratio: float,
    has_audio: bool,
) -> str:
    ref_block = reference_transcript.strip() if reference_transcript else "(none — free response)"
    part = speaking_part or "free"
    audio_note = (
        "An audio recording of the learner is attached — use it for pronunciation, "
        "fluency (hesitation, fillers), and intelligibility. Transcript may have ASR errors."
        if has_audio
        else "No audio attached — rely on transcript and acoustic metrics only."
    )
    return f"""You are an experienced IELTS Speaking examiner. Score objectively using bands 4.0–9.0 (one decimal). Do not compress all answers to Band 6.

{audio_note}

Speaking part / mode: {part} (1=short answers, 2=long turn/cue card, 3=discussion, shadowing=read/repeat script)
Examiner prompt / question:
{prompt_text}

Reference script (shadowing only; may be empty):
{ref_block}

Learner CEFR context: {cefr_level}
Prior speaking overall bands: {score_history[-5:] if score_history else []}
Audio duration (seconds): {audio_duration_s:.1f}
Approximate word count from ASR: {word_count}

Automated acoustic / NLP anchors (calibrate — do not ignore completely):
- Acoustic pronunciation band: {pronunciation_acoustic_band:.1f}
- FC anchor (pause/filler/WPM): {fc_anchor:.1f}
- LR anchor (TTR): {lr_anchor:.1f}
- GRA anchor (grammar heuristics): {gra_anchor:.1f}
- WER band: {dimensions.wer.band:.1f} (WER={dimensions.wer.value:.3f})
- WPM band: {dimensions.fluency.band:.1f} (WPM={dimensions.fluency.value:.1f})
- Prosody band: {dimensions.prosody.band:.1f}
- Completeness band: {dimensions.completeness.band:.1f}
- Pause ratio: {pause_ratio:.2f}; fillers per 100 words: {fillers_per_100_words:.1f}
- Prompt relevance ratio: {relevance_ratio:.2f}

Learner transcript (ASR — may contain recognition errors):
---
{hypothesis_transcript}
---

Return ONLY a JSON object (no markdown fences) with exactly these snake_case keys:
{{
  "fluency_and_coherence": <number 0-9, one decimal>,
  "lexical_resource": <number 0-9, one decimal>,
  "grammatical_range_and_accuracy": <number 0-9, one decimal>,
  "pronunciation": <number 0-9, one decimal>,
  "improvement_suggestions": [
    {{"excerpt": "<short quote from transcript>", "suggestion": "<specific fix>", "example": "<one improved sentence>"}}
  ]
}}

Rules:
- For shadowing: penalise mispronunciation / missing words (WER + audio).
- For Parts 1–3: relevance to prompt, development, cohesion, vocabulary, grammar, intelligibility.
- pronunciation: within ±1.0 of acoustic band unless audio clearly contradicts.
- fluency_and_coherence: within ±1.0 of FC anchor unless audio clearly contradicts.
- If answer very short for Part 2 (<35 words), cap FC/LR/GRA appropriately.
- improvement_suggestions: 2–4 items grounded in transcript/audio.
"""


def _parse_json_text(raw: str) -> dict[str, Any]:
    raw = raw.strip()
    m = _JSON_BLOCK.search(raw)
    if m:
        raw = m.group(1).strip()
    return cast(dict[str, Any], json.loads(raw))


def _clamp_band(x: object, default: float) -> float:
    if isinstance(x, bool) or not isinstance(x, (int, float, str)):
        return default
    try:
        v = float(x)
    except ValueError:
        return default
    return max(0.0, min(9.0, round(v, 1)))


def _parse_suggestions(raw: object) -> list[SpeakingImprovementSuggestion]:
    out: list[SpeakingImprovementSuggestion] = []
    if not isinstance(raw, list):
        return out
    for item in raw[:4]:
        if not isinstance(item, dict):
            continue
        excerpt = str(item.get("excerpt") or item.get("sentence_span") or "").strip()
        suggestion = str(item.get("suggestion") or "").strip()
        if not excerpt or not suggestion:
            continue
        example = item.get("example") or item.get("cefr_aligned_example")
        out.append(
            SpeakingImprovementSuggestion(
                excerpt=excerpt[:300],
                suggestion=suggestion[:500],
                example=str(example).strip()[:400] if example else None,
            )
        )
    return out


def _calibrate_gemini_bands(
    result: GeminiSpeakingRubricResult,
    *,
    p_acoustic: float,
    fc_anchor: float,
    lr_anchor: float,
    gra_anchor: float,
) -> GeminiSpeakingRubricResult:
    """Gộp Gemini với anchor acoustic/NLP — tránh lệch quá xa metric."""
    return GeminiSpeakingRubricResult(
        fluency_and_coherence=round_ielts_band(
            result.fluency_and_coherence * 0.65 + fc_anchor * 0.35
        ),
        lexical_resource=round_ielts_band(
            result.lexical_resource * 0.55 + lr_anchor * 0.45
        ),
        grammatical_range_and_accuracy=round_ielts_band(
            result.grammatical_range_and_accuracy * 0.55 + gra_anchor * 0.45
        ),
        pronunciation=round_ielts_band(
            result.pronunciation * 0.5 + p_acoustic * 0.5
        ),
        improvement_suggestions=result.improvement_suggestions,
        parse_meta=result.parse_meta,
    )


def _sync_score(
    settings: Settings,
    *,
    prompt_text: str,
    hypothesis_transcript: str,
    reference_transcript: str | None,
    cefr_level: CefrLevel,
    speaking_part: SpeakingPart | None,
    score_history: list[float],
    dimensions: PronunciationDimensions,
    pronunciation_acoustic_band: float,
    ttr: float,
    lr_anchor: float,
    fc_anchor: float,
    gra_anchor: float,
    word_count: int,
    audio_duration_s: float,
    pause_ratio: float,
    fillers_per_100_words: float,
    relevance_ratio: float,
    wav_path: Path | None,
) -> tuple[GeminiSpeakingRubricResult | None, str | None]:
    if not settings.google_ai_api_key:
        return (
            None,
            "Thiếu GOOGLE_AI_API_KEY — dùng heuristic speaking rubric.",
        )

    import google.generativeai as genai

    genai.configure(api_key=settings.google_ai_api_key)  # type: ignore[attr-defined]
    model = genai.GenerativeModel(settings.gemini_model)  # type: ignore[attr-defined]
    use_audio = bool(
        settings.ass_gemini_use_audio and wav_path and wav_path.is_file()
    )
    prompt = _build_prompt(
        prompt_text=prompt_text,
        hypothesis_transcript=hypothesis_transcript,
        reference_transcript=reference_transcript,
        cefr_level=cefr_level,
        speaking_part=speaking_part,
        score_history=score_history,
        dimensions=dimensions,
        pronunciation_acoustic_band=pronunciation_acoustic_band,
        ttr=ttr,
        lr_anchor=lr_anchor,
        fc_anchor=fc_anchor,
        gra_anchor=gra_anchor,
        word_count=word_count,
        audio_duration_s=audio_duration_s,
        pause_ratio=pause_ratio,
        fillers_per_100_words=fillers_per_100_words,
        relevance_ratio=relevance_ratio,
        has_audio=use_audio,
    )

    contents: list[object] = [prompt]
    uploaded = None
    if use_audio and wav_path is not None:
        try:
            uploaded = genai.upload_file(  # type: ignore[attr-defined]
                path=str(wav_path),
                mime_type="audio/wav",
            )
            contents.append(uploaded)
        except Exception as e:
            logger.warning("Gemini audio upload skipped: %s", e)
            use_audio = False

    try:
        resp = model.generate_content(
            contents,
            generation_config={
                "temperature": 0.15,
                "response_mime_type": "application/json",
            },
        )
        text = (resp.text or "").strip()
    except Exception as e:
        logger.warning("Gemini speaking rubric failed: %s", e)
        return None, f"Lỗi Gemini ({type(e).__name__}): {str(e)[:220]}"
    finally:
        if uploaded is not None:
            try:
                genai.delete_file(uploaded.name)  # type: ignore[attr-defined]
            except Exception:
                pass

    if not text:
        return None, "Gemini trả về rỗng."

    try:
        data = _parse_json_text(text)
    except json.JSONDecodeError as e:
        return None, f"Không parse được JSON Gemini: {e}"

    p_acoustic = pronunciation_acoustic_band
    raw = GeminiSpeakingRubricResult(
        fluency_and_coherence=_clamp_band(
            data.get("fluency_and_coherence"), fc_anchor
        ),
        lexical_resource=_clamp_band(data.get("lexical_resource"), lr_anchor),
        grammatical_range_and_accuracy=_clamp_band(
            data.get("grammatical_range_and_accuracy"), gra_anchor
        ),
        pronunciation=_clamp_band(data.get("pronunciation"), p_acoustic),
        improvement_suggestions=_parse_suggestions(
            data.get("improvement_suggestions")
        ),
        parse_meta={
            "raw_keys": list(data.keys()),
            "used_audio": use_audio,
        },
    )
    calibrated = _calibrate_gemini_bands(
        raw,
        p_acoustic=p_acoustic,
        fc_anchor=fc_anchor,
        lr_anchor=lr_anchor,
        gra_anchor=gra_anchor,
    )
    return calibrated, None


async def score_speaking_with_gemini(
    settings: Settings,
    *,
    prompt_text: str,
    hypothesis_transcript: str,
    reference_transcript: str | None,
    cefr_level: CefrLevel,
    speaking_part: SpeakingPart | None,
    score_history: list[float],
    dimensions: PronunciationDimensions,
    pronunciation_acoustic_band: float,
    ttr: float,
    lr_anchor: float,
    fc_anchor: float,
    gra_anchor: float,
    word_count: int,
    audio_duration_s: float,
    pause_ratio: float,
    fillers_per_100_words: float,
    relevance_ratio: float,
    wav_path: Path | None,
) -> tuple[GeminiSpeakingRubricResult | None, str | None]:
    return await asyncio.to_thread(
        _sync_score,
        settings,
        prompt_text=prompt_text,
        hypothesis_transcript=hypothesis_transcript,
        reference_transcript=reference_transcript,
        cefr_level=cefr_level,
        speaking_part=speaking_part,
        score_history=score_history,
        dimensions=dimensions,
        pronunciation_acoustic_band=pronunciation_acoustic_band,
        ttr=ttr,
        lr_anchor=lr_anchor,
        fc_anchor=fc_anchor,
        gra_anchor=gra_anchor,
        word_count=word_count,
        audio_duration_s=audio_duration_s,
        pause_ratio=pause_ratio,
        fillers_per_100_words=fillers_per_100_words,
        relevance_ratio=relevance_ratio,
        wav_path=wav_path,
    )

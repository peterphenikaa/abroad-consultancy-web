from __future__ import annotations

import asyncio
import json
import logging
import re
from dataclasses import dataclass
from typing import Any, cast

import google.generativeai as genai

from app.config import Settings
from app.schemas import DescriptorChunk, EssayScoreRequest, ImprovementSuggestion, InlineAnnotation

logger = logging.getLogger(__name__)

_JSON_BLOCK = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)


@dataclass
class GeminiRubricResult:
    task_achievement: float
    coherence_and_cohesion: float
    lexical_resource: float
    grammatical_range_and_accuracy: float
    inline_annotations: list[InlineAnnotation]
    improvement_suggestions: list[ImprovementSuggestion]
    parse_meta: dict[str, Any] | None = None


def _first_value(data: dict[str, Any], *keys: str) -> Any:
    for k in keys:
        if k in data and data[k] is not None:
            return data[k]
    return None


def _descriptor_block(descriptors: list[DescriptorChunk]) -> str:
    parts: list[str] = []
    for i, d in enumerate(descriptors[:12], start=1):
        parts.append(f"[{i}] {d.text.strip()}")
    return "\n\n".join(parts) if parts else "(No descriptor chunks retrieved — use standard IELTS public band descriptors mentally.)"


def _build_prompt(
    payload: EssayScoreRequest,
    descriptor_block: str,
    ttr: float,
    mtld: float,
    lr_anchor: float,
    word_count: int,
) -> str:
    min_words_t2 = 150
    min_words_t1 = 100
    min_words = min_words_t2 if int(payload.task_type) == 2 else min_words_t1
    return f"""You are an experienced IELTS Writing examiner. Score objectively using the full band range 4.0–9.0; do not compress everything toward Band 6 unless the work truly sits there.

Official task prompt:
{payload.prompt_text}

Task type: {payload.task_type} (1 = visual/chart summary style, 2 = essay opinion/discussion)
Approximate word count (regex tokens): {word_count} (typical Task 2 target ~250 words; serious underlength should reduce Task Achievement and often overall.)
Learner CEFR context (target level): {payload.cefr_level}
Prior writing scores (bands, if useful): {payload.writing_score_history}

CAM_EDU / band-descriptor context (from retrieval; may be empty):
{descriptor_block}

Automated lexical signal (reference only — not the final LR band by itself):
- Type–token ratio (spaCy tokens): {ttr:.4f}
- MTLD (Measure of Textual Lexical Diversity, forward, threshold 0.72; spaCy tokens): {mtld:.4f}
- Length-adjusted LR anchor (TTR is unreliable on very short texts): {lr_anchor:.1f}. Judge collocation, precision, spelling/word-formation, and range from the essay and descriptors; you may move LR more than ±0.75 away from this anchor when length, errors, or repetition clearly justify it.

Student essay (character indices refer to THIS string exactly):
---
{payload.essay_plaintext}
---

Return ONLY a JSON object (no markdown fences) with this shape. Property names MUST be exactly these snake_case strings (required for parsing):
{{
  "task_achievement": <number 0-9, one decimal>,
  "coherence_and_cohesion": <number 0-9, one decimal>,
  "lexical_resource": <number 0-9, one decimal>,
  "grammatical_range_and_accuracy": <number 0-9, one decimal>,
  "inline_annotations": [
    {{"start": <int>, "end": <int>, "criterion": "TA"|"CC"|"LR"|"GRA", "message": "<short examiner note>"}}
  ],
  "improvement_suggestions": [
    {{"sentence_span": "<verbatim excerpt from essay>", "suggestion": "<specific fix>", "cefr_aligned_example": "<one improved sentence at learner CEFR>"}}
  ]
}}

Rules:
- If word count is well below ~{min_words} for this task type, penalise Task Achievement (and usually CC/LR/GRA) for lack of development; fragments or outline-level answers are often Band 3–5 overall, not Band 6+.
- If the essay is a strong Band 7+ sample (clear position, developed paragraphs, good cohesion, range and accuracy), award 7+ on the relevant criteria even when CEFR is lower — CEFR is context, not a hard ceiling.
- lexical_resource: use essay + descriptors + the TTR and MTLD signals above + the length-adjusted anchor; do not inflate LR on very short answers just because type–token ratio happens to be high.
- inline_annotations: 3–8 items, spans must fall within 0..{max(0, len(payload.essay_plaintext) - 1)} and start < end.
- improvement_suggestions: 2–4 items, grounded in the essay.
- criterion must be exactly TA, CC, LR, or GRA.
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


def _sync_score(
    settings: Settings,
    payload: EssayScoreRequest,
    descriptors: list[DescriptorChunk],
    ttr: float,
    mtld: float,
    lr_anchor: float,
    word_count: int,
) -> tuple[GeminiRubricResult | None, str | None]:
    """
    Gọi Gemini. Thành công → (result, None). Lỗi → (None, lý do tiếng Việt cho UI/log).
    """
    if not settings.google_ai_api_key:
        return (
            None,
            "Thiếu GOOGLE_AI_API_KEY trong cấu hình worker (file .env trong thư mục ai-scoring-worker). "
            "Sau khi thêm key, hãy khởi động lại tiến trình uvicorn.",
        )

    genai.configure(api_key=settings.google_ai_api_key)  # type: ignore[attr-defined]
    model = genai.GenerativeModel(settings.gemini_model)  # type: ignore[attr-defined]
    desc_block = _descriptor_block(descriptors)
    prompt = _build_prompt(payload, desc_block, ttr, mtld, lr_anchor, word_count)

    try:
        resp = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.15,
                "response_mime_type": "application/json",
            },
        )
    except Exception as e:
        logger.warning("Gemini request failed: %s", e)
        return (
            None,
            f"Lỗi gọi API Gemini ({type(e).__name__}): {str(e)[:220]}. "
            "Kiểm tra key, quota, tên model GEMINI_MODEL và mạng."
            + (
                " Với lỗi 400 'unexpected model name format': đặt GEMINI_MODEL=gemini-2.5-flash (không tiền tố models/)."
                if "unexpected model name" in str(e).lower()
                else ""
            ),
        )

    text = ""
    try:
        text = (resp.text or "").strip()
    except ValueError:
        try:
            cand = resp.candidates[0]
            for part in cand.content.parts:
                if getattr(part, "text", None):
                    text += part.text
            text = text.strip()
        except (AttributeError, IndexError, KeyError):
            text = ""

    if not text:
        extra = ""
        try:
            if getattr(resp, "candidates", None):
                c0 = resp.candidates[0]
                fr = getattr(c0, "finish_reason", None)
                if fr is not None:
                    extra += f" finish_reason={fr}."
        except (AttributeError, IndexError):
            pass
        try:
            pf = getattr(resp, "prompt_feedback", None)
            if pf is not None:
                br = getattr(pf, "block_reason", None)
                if br is not None:
                    extra += f" block_reason={br}."
        except Exception:
            pass
        logger.warning("Gemini empty or blocked response%s", extra)
        return (
            None,
            "Gemini không trả nội dung (phản hồi rỗng hoặc bị chặn safety / policy)."
            + extra
            + f" Model hiện tại: {settings.gemini_model}. Thử đổi GEMINI_MODEL (ví dụ gemini-2.5-flash) hoặc rút ngắn prompt+bài.",
        )

    try:
        data = _parse_json_text(text)
    except json.JSONDecodeError as e:
        logger.warning("Gemini JSON parse failed: %s | snippet=%s", e, text[:400])
        return (
            None,
            f"Phản hồi Gemini không phải JSON hợp lệ ({e.msg}). Có thể model không tuân response_mime_type.",
        )

    if not isinstance(data, dict):
        return (
            None,
            f"JSON Gemini phải là object {{...}}, không phải {type(data).__name__}.",
        )

    essay = payload.essay_plaintext
    n = len(essay)

    ann_out: list[InlineAnnotation] = []
    for a in data.get("inline_annotations") or []:
        if not isinstance(a, dict):
            continue
        try:
            s, e = int(a["start"]), int(a["end"])
        except (KeyError, TypeError, ValueError):
            continue
        s = max(0, min(s, max(0, n - 1)))
        e = max(s + 1, min(e, n))
        crit = str(a.get("criterion", "TA")).upper()
        if crit not in ("TA", "CC", "LR", "GRA"):
            crit = "TA"
        msg = str(a.get("message", "")).strip() or "Comment"
        ann_out.append(
            InlineAnnotation(
                start=s,
                end=e,
                criterion=crit,  # type: ignore[arg-type]
                color_token=crit,
                message=msg[:500],
            )
        )

    sug_out: list[ImprovementSuggestion] = []
    for s in data.get("improvement_suggestions") or []:
        if not isinstance(s, dict):
            continue
        span = str(s.get("sentence_span", "")).strip()[:600]
        sug = str(s.get("suggestion", "")).strip()[:800]
        ex = str(s.get("cefr_aligned_example", "")).strip()[:800]
        if not span or not sug or not ex:
            continue
        sug_out.append(
            ImprovementSuggestion(
                sentence_span=span,
                suggestion=sug,
                cefr_aligned_example=ex,
            )
        )

    ta_raw = _first_value(
        data,
        "task_achievement",
        "taskAchievement",
        "TaskAchievement",
    )
    cc_raw = _first_value(
        data,
        "coherence_and_cohesion",
        "coherenceAndCohesion",
        "CoherenceAndCohesion",
    )
    lr_raw = _first_value(
        data,
        "lexical_resource",
        "lexicalResource",
        "LexicalResource",
    )
    gra_raw = _first_value(
        data,
        "grammatical_range_and_accuracy",
        "grammaticalRangeAndAccuracy",
        "GrammaticalRangeAndAccuracy",
    )

    missing = [
        name
        for name, raw in (
            ("task_achievement", ta_raw),
            ("coherence_and_cohesion", cc_raw),
            ("lexical_resource", lr_raw),
            ("grammatical_range_and_accuracy", gra_raw),
        )
        if raw is None
    ]
    if missing:
        logger.warning(
            "Gemini JSON missing criterion field(s) %s — using clamp defaults (often ~5.5). Top-level keys: %s",
            missing,
            sorted(data.keys()),
        )

    ta = _clamp_band(ta_raw, 5.5)
    cc = _clamp_band(cc_raw, 5.5)
    lr = _clamp_band(lr_raw, lr_anchor)
    gra = _clamp_band(gra_raw, 5.5)

    parse_meta: dict[str, Any] = {
        "json_top_level_keys": sorted(data.keys()),
        "raw_criteria": {
            "task_achievement": ta_raw,
            "coherence_and_cohesion": cc_raw,
            "lexical_resource": lr_raw,
            "grammatical_range_and_accuracy": gra_raw,
        },
        "after_clamp": {
            "task_achievement": ta,
            "coherence_and_cohesion": cc,
            "lexical_resource": lr,
            "grammatical_range_and_accuracy": gra,
        },
        "missing_criteria": missing,
    }

    return (
        GeminiRubricResult(
            task_achievement=ta,
            coherence_and_cohesion=cc,
            lexical_resource=lr,
            grammatical_range_and_accuracy=gra,
            inline_annotations=ann_out,
            improvement_suggestions=sug_out,
            parse_meta=parse_meta,
        ),
        None,
    )


async def score_with_gemini(
    settings: Settings,
    payload: EssayScoreRequest,
    descriptors: list[DescriptorChunk],
    ttr: float,
    mtld: float,
    lr_anchor: float,
    *,
    word_count: int,
) -> tuple[GeminiRubricResult | None, str | None]:
    """Gọi Gemini (JSON mode). Trả về (kết quả, None) hoặc (None, lý do thất bại)."""
    if not settings.google_ai_api_key:
        return (
            None,
            "Thiếu GOOGLE_AI_API_KEY trong cấu hình worker (ai-scoring-worker/.env). "
            "Thêm key rồi khởi động lại uvicorn.",
        )
    return await asyncio.to_thread(
        _sync_score, settings, payload, descriptors, ttr, mtld, lr_anchor, word_count
    )

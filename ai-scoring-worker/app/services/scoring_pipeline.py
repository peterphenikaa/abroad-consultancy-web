import re
import logging

from app.config import Settings
from app.schemas import (
    EssayScoreRequest,
    EssayScoreResponse,
    ImprovementSuggestion,
    InlineAnnotation,
    PlagiarismReport,
    RubricScores,
    ScoringSource,
)
from app.services.deberta_grammar import score_grammar_deberta
from app.services.gemini_rubric import score_with_gemini
from app.services.rag_descriptors import retrieve_cam_descriptors
from auto_essay_scoring.nlp_metrics import calculate_mtld, calculate_ttr

logger = logging.getLogger(__name__)

# Band tổng: 0.25 * (TA + CC + LR + GRA). LR: Gemini + RAG + anchor TTR đã hiệu chỉnh theo độ dài bài
# (TTR thuần trên bài rất ngắn dễ phình → trước đây kéo điểm tối thiểu ~6). GRA: DeBERTa khi có model; không thì Gemini.


def _word_count(text: str) -> int:
    return len(re.findall(r"\b[\w']+\b", text))


def lexical_band_from_ttr(ttr: float) -> float:
    """
    Ánh xạ TTR (spaCy token) sang band Lexical Resource 4.0–9.0.
    TTR ~0.28–0.62 thường gặp với bài essay tiếng Anh độ dài trung bình.
    """
    if ttr <= 0:
        return 5.5
    x = max(0.28, min(0.62, ttr))
    band = 4.0 + (x - 0.28) / (0.62 - 0.28) * (8.5 - 4.0)
    return round(max(4.0, min(9.0, band)), 1)


def lexical_lr_anchor(essay: str, ttr: float, task_type: int) -> float:
    """
    Anchor LR cho Gemini: TTR trên bài rất ngắn thường bị phình (ít lặp từ → TTR cao),
    không phản ánh phạm vi từ vựng thật — trộn về mức trung bình cho tới khi bài đủ dài.
    """
    wc = max(_word_count(essay), 1)
    base = lexical_band_from_ttr(ttr)
    min_full = 250 if task_type == 2 else 150
    if wc >= min_full:
        return base
    p = min(1.0, wc / float(min_full))
    weight = p * p
    neutral = 5.25
    blended = neutral + (base - neutral) * weight
    return round(max(4.0, min(9.0, blended)), 1)


def _heuristic_rubric(essay: str, ttr: float, task_type: int) -> RubricScores:
    """Fallback khi không gọi được Gemini: heuristic đơn giản + LR từ TTR."""
    wc = max(_word_count(essay), 1)
    length_factor = min(wc / 250.0, 1.2)
    base = 5.5 + 0.8 * (length_factor - 0.5)
    lr = lexical_lr_anchor(essay, ttr, task_type)
    ta = max(4.0, min(8.0, base))
    cc = max(4.0, min(8.0, base - 0.2))
    gra = max(4.0, min(8.0, base - 0.3))
    return RubricScores(
        task_achievement=round(ta, 1),
        coherence_and_cohesion=round(cc, 1),
        lexical_resource=lr,
        grammatical_range_and_accuracy=round(gra, 1),
    )


def _band_total(r: RubricScores) -> float:
    return round(
        0.25 * r.task_achievement
        + 0.25 * r.coherence_and_cohesion
        + 0.25 * r.lexical_resource
        + 0.25 * r.grammatical_range_and_accuracy,
        1,
    )


def _placeholder_annotations(essay: str) -> list[InlineAnnotation]:
    out: list[InlineAnnotation] = []
    m = re.search(r"[^.!?]+[.!?]", essay.strip())
    if m:
        out.append(
            InlineAnnotation(
                start=m.start(),
                end=m.end(),
                criterion="TA",
                color_token="TA",
                message="Kiểm tra bám đề / overview và so sánh (Task 1) hoặc luận điểm (Task 2).",
            )
        )
    return out


def _default_suggestions(payload: EssayScoreRequest) -> list[ImprovementSuggestion]:
    excerpt = payload.essay_plaintext.strip()[:220]
    return [
        ImprovementSuggestion(
            sentence_span=excerpt or "(empty)",
            suggestion="Làm rõ luận điểm chính và thêm ví dụ hoặc số liệu cụ thể bám đề.",
            cefr_aligned_example=f"At {payload.cefr_level}, aim for clear topic sentences and one concrete supporting detail per paragraph.",
        )
    ]


def _placeholder_plagiarism() -> PlagiarismReport:
    return PlagiarismReport(score_percent=0.0, suspected_sources=[])


def _placeholder_ai_score(essay: str) -> float:
    wc = _word_count(essay)
    return round(min(0.35, 0.05 + wc / 5000.0), 3)


async def score_essay(settings: Settings, payload: EssayScoreRequest) -> EssayScoreResponse:
    descriptors = await retrieve_cam_descriptors(settings, payload)
    if descriptors:
        logger.debug("RAG returned %d descriptor chunks", len(descriptors))

    try:
        ttr = calculate_ttr(payload.essay_plaintext)
    except Exception as e:
        logger.warning("TTR failed: %s", e)
        ttr = 0.0

    try:
        mtld = calculate_mtld(payload.essay_plaintext)
    except Exception as e:
        logger.warning("MTLD failed: %s", e)
        mtld = 0.0

    tt = int(payload.task_type)
    lr_anchor = lexical_lr_anchor(payload.essay_plaintext, ttr, tt)
    wc = _word_count(payload.essay_plaintext)
    fallback = _heuristic_rubric(payload.essay_plaintext, ttr, tt)

    gem, gem_fail_reason = await score_with_gemini(
        settings,
        payload,
        descriptors,
        ttr,
        mtld,
        lr_anchor,
        word_count=wc,
    )
    source: ScoringSource = "heuristic"
    scoring_debug: dict | None = None

    if gem:
        source = "gemini"
        deberta_gra = score_grammar_deberta(payload.essay_plaintext)
        gra = (
            round(max(4.0, min(9.0, deberta_gra)), 1)
            if deberta_gra is not None
            else gem.grammatical_range_and_accuracy
        )
        rubric = RubricScores(
            task_achievement=gem.task_achievement,
            coherence_and_cohesion=gem.coherence_and_cohesion,
            lexical_resource=round(max(4.0, min(9.0, gem.lexical_resource)), 1),
            grammatical_range_and_accuracy=gra,
        )
        annotations = gem.inline_annotations or _placeholder_annotations(
            payload.essay_plaintext
        )
        suggestions = gem.improvement_suggestions or _default_suggestions(payload)
        logger.info(
            "Scoring: Gemini TA=%s CC=%s LR=%s GRA=%s (overall=%.1f); GRA_src=%s",
            rubric.task_achievement,
            rubric.coherence_and_cohesion,
            rubric.lexical_resource,
            rubric.grammatical_range_and_accuracy,
            _band_total(rubric),
            "DeBERTa" if deberta_gra is not None else "Gemini",
        )
    else:
        rubric = fallback
        annotations = _placeholder_annotations(payload.essay_plaintext)
        suggestions = _default_suggestions(payload)
        if settings.google_ai_api_key:
            logger.warning(
                "Scoring: heuristic fallback (Gemini failed or empty). "
                "Điểm heuristic thường quanh 5.5–6 — không phản ánh band 5 vs 7 thật."
            )
        else:
            logger.info("Scoring: no GOOGLE_AI_API_KEY — heuristic + TTR only")

    band = _band_total(rubric)

    if settings.aes_debug_scoring:
        scoring_debug = {
            "word_count": wc,
            "ttr": ttr,
            "mtld": mtld,
            "lr_anchor": lr_anchor,
            "rag_descriptor_count": len(descriptors),
            "gemini_model": settings.gemini_model,
        }
        if gem and gem.parse_meta is not None:
            scoring_debug["gemini_parse"] = gem.parse_meta
        if not gem:
            scoring_debug["heuristic_rubric"] = {
                "task_achievement": rubric.task_achievement,
                "coherence_and_cohesion": rubric.coherence_and_cohesion,
                "lexical_resource": rubric.lexical_resource,
                "grammatical_range_and_accuracy": rubric.grammatical_range_and_accuracy,
            }
            if gem_fail_reason:
                scoring_debug["gemini_failure"] = gem_fail_reason

    return EssayScoreResponse(
        band_overall=band,
        scoring_source=source,
        scoring_debug=scoring_debug if settings.aes_debug_scoring else None,
        scoring_fallback_reason=gem_fail_reason if source == "heuristic" else None,
        rubric=rubric,
        descriptors_retrieved=descriptors,
        inline_annotations=annotations,
        improvement_suggestions=suggestions,
        plagiarism=_placeholder_plagiarism(),
        ai_generated_score=_placeholder_ai_score(payload.essay_plaintext),
        lexical_ttr=ttr,
        lexical_mtld=mtld,
    )

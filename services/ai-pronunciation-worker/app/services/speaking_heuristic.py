"""Fallback IELTS Speaking rubric khi Gemini không khả dụng — acoustic + NLP heuristic."""

from __future__ import annotations

from app.schemas import (
    PronunciationDimensions,
    SpeakingImprovementSuggestion,
    SpeakingRubric,
    WordErrorItem,
)
from app.services.metrics_fluency_advanced import FluencySignals
from app.services.metrics_grammar_heuristic import GrammarSignals
from app.services.score_fusion import round_ielts_band
from app.services.speaking_band_fusion import acoustic_pronunciation_band


def heuristic_speaking_rubric(
    dimensions: PronunciationDimensions,
    *,
    lr_anchor: float,
    fc_anchor: float,
    gra_anchor: float,
) -> SpeakingRubric:
    p = acoustic_pronunciation_band(dimensions)
    fc = round_ielts_band(fc_anchor)
    lr = round_ielts_band(max(4.0, min(9.0, lr_anchor)))
    gra = round_ielts_band(gra_anchor)
    return SpeakingRubric(
        fluency_and_coherence=fc,
        lexical_resource=lr,
        grammatical_range_and_accuracy=gra,
        pronunciation=p,
    )


def heuristic_improvement_suggestions(
    *,
    hypothesis: str,
    word_errors: list[WordErrorItem],
    fluency: FluencySignals,
    grammar: GrammarSignals,
) -> list[SpeakingImprovementSuggestion]:
    out: list[SpeakingImprovementSuggestion] = []

    for err in word_errors[:2]:
        out.append(
            SpeakingImprovementSuggestion(
                excerpt=err.word,
                suggestion=f"Lỗi {err.error_type} — kiểm tra phát âm/từ này so với script.",
                example=None,
            )
        )

    if fluency.filler_count >= 2:
        excerpt = hypothesis[:120].strip() or "(transcript)"
        out.append(
            SpeakingImprovementSuggestion(
                excerpt=excerpt,
                suggestion=(
                    f"Giảm filler (um/uh/like) — phát hiện ~{fluency.filler_count} lần. "
                    "Nghỉ ngắn thay vì lấp khoảng trống."
                ),
                example="Pause briefly, then continue with the main idea.",
            )
        )

    if fluency.long_pause_count >= 2:
        out.append(
            SpeakingImprovementSuggestion(
                excerpt=hypothesis[:100] or "(transcript)",
                suggestion=(
                    f"Có {fluency.long_pause_count} khoảng dừng dài (>0.75s). "
                    "Luyện nói mạch hơn, chia ý thành cụm ngắn."
                ),
                example=None,
            )
        )

    if grammar.error_hits >= 0.5 and hypothesis:
        out.append(
            SpeakingImprovementSuggestion(
                excerpt=hypothesis[:100],
                suggestion="Kiểm tra chia động từ và mạo từ (a/an/the) trong câu.",
                example=None,
            )
        )

    return out[:4]

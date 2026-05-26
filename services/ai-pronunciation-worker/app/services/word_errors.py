"""Extract word-level errors — MVP: từ reference không có trong hypothesis."""

from __future__ import annotations

from app.schemas import AsrSegment, WordErrorItem
from app.services.metrics_wer import normalize_text


def build_word_errors(
    reference: str,
    hypothesis: str,
    segments: list[AsrSegment],
) -> list[WordErrorItem]:
    ref_words = normalize_text(reference).split()
    hyp_words = set(normalize_text(hypothesis).split())
    if not ref_words:
        return []

    out: list[WordErrorItem] = []
    seg_idx = 0
    for word in ref_words:
        if word in hyp_words:
            continue
        start_s: float | None = None
        end_s: float | None = None
        if seg_idx < len(segments):
            start_s = segments[seg_idx].start_s
            end_s = segments[seg_idx].end_s
            seg_idx += 1
        out.append(
            WordErrorItem(
                word=word,
                start_s=start_s,
                end_s=end_s,
                error_type="deletion",
            )
        )
        if len(out) >= 15:
            break
    return out

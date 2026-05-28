"""Completeness: tỷ lệ từ reference xuất hiện trong hypothesis."""

from __future__ import annotations

from app.services.metrics_wer import normalize_text


def compute_completeness_ratio(reference: str, hypothesis: str) -> float:
    ref_words = set(normalize_text(reference).split())
    if not ref_words:
        return 1.0
    hyp_words = set(normalize_text(hypothesis).split())
    hit = len(ref_words & hyp_words)
    return hit / len(ref_words)


def completeness_to_band(ratio: float) -> float:
    if ratio >= 0.95:
        return 8.0
    if ratio >= 0.85:
        return 7.0
    if ratio >= 0.70:
        return 6.0
    if ratio >= 0.55:
        return 5.0
    return 4.0

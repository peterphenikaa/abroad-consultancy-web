"""Lexical signals từ transcript (MVP — không cần spaCy)."""

from __future__ import annotations

import re

from app.services.metrics_wer import normalize_text


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w']+\b", text))


def compute_ttr(text: str) -> float:
    """Type–token ratio trên transcript đã normalize."""
    words = normalize_text(text).split()
    if not words:
        return 0.0
    return len(set(words)) / len(words)


def ttr_to_lr_anchor(ttr: float, word_count: int) -> float:
    """Anchor LR 4–8 từ TTR + độ dài (speaking thường ngắn hơn writing)."""
    if word_count < 15:
        base = 4.5
    elif word_count < 40:
        base = 5.0
    elif word_count < 80:
        base = 5.5
    else:
        base = 6.0

    if ttr >= 0.72:
        base += 1.2
    elif ttr >= 0.58:
        base += 0.7
    elif ttr >= 0.45:
        base += 0.2
    else:
        base -= 0.3

    return max(4.0, min(8.5, round(base, 1)))

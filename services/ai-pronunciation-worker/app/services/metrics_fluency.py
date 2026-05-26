"""Fluency: speaking rate (WPM) từ hypothesis + duration."""

from __future__ import annotations

import re


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w']+\b", text))


def compute_wpm(hypothesis: str, duration_s: float) -> float:
    if duration_s <= 0:
        return 0.0
    wc = word_count(hypothesis)
    return wc / (duration_s / 60.0)


def wpm_to_band(wpm: float, cefr: str = "B2") -> float:
    """
    Ideal conversational English ~110–150 WPM for learners.
    Too slow / too fast both penalised slightly.
    """
    targets: dict[str, tuple[float, float]] = {
        "A1": (70, 100),
        "A2": (80, 110),
        "B1": (90, 120),
        "B2": (100, 140),
        "C1": (110, 150),
        "C2": (110, 160),
    }
    lo, hi = targets.get(cefr.upper(), (100, 140))
    mid = (lo + hi) / 2
    half = (hi - lo) / 2 or 1.0
    dist = abs(wpm - mid) / half
    band = 7.5 - min(3.0, dist * 1.5)
    return round(max(4.0, min(9.0, band)), 1)

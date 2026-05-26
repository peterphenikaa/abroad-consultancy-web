"""WER = (S + D + I) / N — paper §1.6."""

from __future__ import annotations

import re

import jiwer


def normalize_text(text: str) -> str:
    t = text.lower().strip()
    t = re.sub(r"[^\w\s']", " ", t)
    return " ".join(t.split())


def compute_wer(reference: str, hypothesis: str) -> float:
    ref = normalize_text(reference)
    hyp = normalize_text(hypothesis)
    if not ref:
        return 1.0 if hyp else 0.0
    return float(jiwer.wer(ref, hyp))


def wer_to_band(wer: float) -> float:
    """Map WER → CAM_EDU band (tunable). Lower WER = higher band."""
    if wer <= 0.05:
        return 8.5
    if wer <= 0.10:
        return 7.5
    if wer <= 0.15:
        return 6.5
    if wer <= 0.25:
        return 5.5
    if wer <= 0.35:
        return 4.5
    return 4.0

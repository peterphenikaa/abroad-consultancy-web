"""Phoneme Accuracy: PA = (1/K) Σ 1[p̂_k = p_k] · w_k — paper §1.6."""

from __future__ import annotations

import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

_DEFAULT_WEIGHTS: dict[str, float] = {
    "l": 1.2,
    "n": 1.2,
    "s": 1.1,
    "sh": 1.1,
    "p": 1.3,
    "t": 1.3,
    "k": 1.3,
    "ch": 1.3,
}


def load_vi_phoneme_weights(path: str | Path) -> dict[str, float]:
    p = Path(path)
    if not p.is_file():
        logger.warning("vi_phoneme_weights not found at %s — using defaults", p)
        return dict(_DEFAULT_WEIGHTS)
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return {str(k): float(v) for k, v in data.items()}
    except (json.JSONDecodeError, TypeError, ValueError) as e:
        logger.warning("Invalid vi_phoneme_weights: %s", e)
    return dict(_DEFAULT_WEIGHTS)


def compute_phoneme_accuracy(
    expected: list[str],
    observed: list[str],
    weights: dict[str, float],
) -> float:
    """
    PA ∈ [0, 1]. Lists must be same length K (pad/truncate caller responsibility).
    """
    if not expected:
        return 0.0
    k = min(len(expected), len(observed))
    if k == 0:
        return 0.0
    total_w = 0.0
    hit_w = 0.0
    for i in range(k):
        exp = expected[i].lower()
        obs = observed[i].lower()
        w = weights.get(exp, 1.0)
        total_w += w
        if exp == obs:
            hit_w += w
    return hit_w / total_w if total_w > 0 else 0.0


def pa_to_band(pa: float) -> float:
    if pa >= 0.90:
        return 8.5
    if pa >= 0.80:
        return 7.5
    if pa >= 0.70:
        return 6.5
    if pa >= 0.60:
        return 5.5
    return 4.5

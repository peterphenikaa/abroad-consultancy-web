"""GRA anchor heuristic — không cần spaCy (MVP)."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.services.metrics_wer import normalize_text
from app.services.score_fusion import round_ielts_band

SENTENCE_SPLIT = re.compile(r"[.!?]+")

SUBORDINATORS = (
    "because",
    "although",
    "though",
    "while",
    "whereas",
    "if",
    "unless",
    "when",
    "before",
    "after",
    "which",
    "that",
    "who",
    "whom",
    "whose",
    "where",
)

# Lỗi phổ biến học viên Việt (ASR có thể bắt một phần)
ERROR_PATTERNS: list[tuple[re.Pattern[str], float]] = [
    (re.compile(r"\b(he|she|it)\s+go\b"), 0.4),
    (re.compile(r"\b(he|she|it)\s+dont\b"), 0.4),
    (re.compile(r"\b(they|we|you)\s+was\b"), 0.4),
    (re.compile(r"\ba\s+\w+ions\b"), 0.3),
    (re.compile(r"\bmore\s+(better|worse|easier)\b"), 0.35),
    (re.compile(r"\bvery\s+unique\b"), 0.25),
]


@dataclass(frozen=True)
class GrammarSignals:
    sentence_count: int
    avg_sentence_len: float
    subordinator_count: int
    error_hits: float
    complex_sentence_ratio: float


def compute_grammar_signals(text: str) -> GrammarSignals:
    norm = normalize_text(text)
    if not norm:
        return GrammarSignals(0, 0.0, 0, 0.0, 0.0)

    raw_sentences = [s.strip() for s in SENTENCE_SPLIT.split(text) if s.strip()]
    sentence_count = max(1, len(raw_sentences))
    words = norm.split()
    wc = len(words)
    avg_len = wc / sentence_count if sentence_count else 0.0

    lower = norm
    sub_count = sum(1 for sw in SUBORDINATORS if f" {sw} " in f" {lower} ")

    error_hits = 0.0
    for pat, weight in ERROR_PATTERNS:
        error_hits += len(pat.findall(lower)) * weight

    complex_ratio = 0.0
    if sentence_count:
        complex_ratio = min(1.0, (sub_count + sum(1 for s in raw_sentences if len(s.split()) >= 12)) / sentence_count)

    return GrammarSignals(
        sentence_count=sentence_count,
        avg_sentence_len=round(avg_len, 2),
        subordinator_count=sub_count,
        error_hits=round(error_hits, 2),
        complex_sentence_ratio=round(complex_ratio, 3),
    )


def grammar_signals_to_gra_anchor(
    signals: GrammarSignals,
    *,
    cefr: str,
    wer_band: float,
    is_shadowing: bool,
    word_count: int,
) -> float:
    cefr_base = {
        "A1": 4.5,
        "A2": 5.0,
        "B1": 5.5,
        "B2": 6.0,
        "C1": 6.5,
        "C2": 7.0,
    }.get(cefr.upper(), 5.5)

    if word_count < 10:
        return round_ielts_band(min(cefr_base, 5.0))

    length_bonus = 0.0
    if signals.avg_sentence_len >= 8:
        length_bonus += 0.3
    if signals.avg_sentence_len >= 14:
        length_bonus += 0.4

    complexity_bonus = signals.complex_sentence_ratio * 1.2 + min(0.8, signals.subordinator_count * 0.15)
    error_pen = min(2.0, signals.error_hits)

    base = cefr_base + length_bonus + complexity_bonus - error_pen

    if is_shadowing:
        base = base * 0.35 + wer_band * 0.65
    else:
        base = base * 0.75 + wer_band * 0.25

    return round_ielts_band(max(4.0, min(8.5, base)))

"""Fluency nâng cao: pause, filler, self-repair từ Whisper segments."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.schemas import AsrSegment
from app.services.score_fusion import round_ielts_band

FILLER_RE = re.compile(
    r"\b(?:um+|uh+|er+|ah+|hmm+|like|you know|sort of|kind of|i mean|basically|actually)\b",
    re.IGNORECASE,
)

LONG_PAUSE_S = 0.75


@dataclass(frozen=True)
class FluencySignals:
    pause_ratio: float
    long_pause_count: int
    filler_count: int
    fillers_per_100_words: float
    speech_ratio: float


def _sorted_segments(segments: list[AsrSegment]) -> list[AsrSegment]:
    return sorted(segments, key=lambda s: s.start_s)


def compute_fluency_signals(
    segments: list[AsrSegment],
    hypothesis: str,
    duration_s: float,
) -> FluencySignals:
    if duration_s <= 0:
        return FluencySignals(0.0, 0, 0, 0.0, 0.0)

    words = re.findall(r"\b[\w']+\b", hypothesis)
    wc = len(words)
    filler_count = len(FILLER_RE.findall(hypothesis))
    fillers_per_100 = (filler_count / wc * 100.0) if wc else 0.0

    if not segments:
        return FluencySignals(0.0, 0, filler_count, fillers_per_100, 0.0)

    ordered = _sorted_segments(segments)
    pause_total = 0.0
    long_pauses = 0
    speech_total = 0.0

    for seg in ordered:
        speech_total += max(0.0, seg.end_s - seg.start_s)

    for i in range(1, len(ordered)):
        gap = ordered[i].start_s - ordered[i - 1].end_s
        if gap > 0.05:
            pause_total += gap
            if gap >= LONG_PAUSE_S:
                long_pauses += 1

    leading = ordered[0].start_s
    if leading > 0.05:
        pause_total += leading
        if leading >= LONG_PAUSE_S:
            long_pauses += 1

    trailing = duration_s - ordered[-1].end_s
    if trailing > 0.05:
        pause_total += trailing

    pause_ratio = min(1.0, pause_total / duration_s)
    speech_ratio = min(1.0, speech_total / duration_s)

    return FluencySignals(
        pause_ratio=round(pause_ratio, 4),
        long_pause_count=long_pauses,
        filler_count=filler_count,
        fillers_per_100_words=round(fillers_per_100, 2),
        speech_ratio=round(speech_ratio, 4),
    )


def fluency_signals_to_fc_anchor(
    *,
    wpm_band: float,
    completeness_band: float,
    signals: FluencySignals,
    relevance_ratio: float | None,
    word_count: int,
    speaking_part: str | None,
    is_shadowing: bool = False,
) -> float:
    """Anchor FC 4–9 từ WPM, completeness, pause, filler, relevance."""
    if is_shadowing:
        base = wpm_band * 0.3 + completeness_band * 0.55 + 6.0 * signals.speech_ratio * 0.1
    else:
        base = wpm_band * 0.38 + completeness_band * 0.32 + 6.0 * signals.speech_ratio * 0.15

    pause_pen = min(2.0, max(0.0, (signals.pause_ratio - 0.12) * 5.5))
    pause_pen += min(1.0, signals.long_pause_count * 0.35)
    if is_shadowing:
        pause_pen *= 0.4

    filler_pen = min(1.5, signals.fillers_per_100_words * 0.22)

    rel = relevance_ratio if relevance_ratio is not None else 0.75
    rel_adj = (rel - 0.5) * 1.2

    band = base - pause_pen - filler_pen + rel_adj

    part = (speaking_part or "").lower()
    if part == "2" and word_count < 35:
        band = min(band, 6.0)
    elif part == "1" and word_count < 12:
        band = min(band, 5.5)
    elif word_count < 8:
        band = min(band, 5.0)

    return round_ielts_band(max(4.0, min(9.0, band)))

"""Unit tests — fluency advanced, grammar, relevance anchors."""

from __future__ import annotations

from app.schemas import AsrSegment
from app.services.metrics_fluency_advanced import (
    compute_fluency_signals,
    fluency_signals_to_fc_anchor,
)
from app.services.metrics_grammar_heuristic import (
    compute_grammar_signals,
    grammar_signals_to_gra_anchor,
)
from app.services.metrics_relevance import prompt_relevance_ratio


def test_pause_detection_from_segments() -> None:
    segments = [
        AsrSegment(text="hello", start_s=0.0, end_s=0.4),
        AsrSegment(text="world", start_s=1.5, end_s=1.9),
    ]
    sig = compute_fluency_signals(segments, "hello world", duration_s=3.0)
    assert sig.long_pause_count >= 1
    assert sig.pause_ratio > 0.1


def test_fc_anchor_penalises_fillers() -> None:
    clean = compute_fluency_signals([], "I enjoy reading books every day.", 10.0)
    filler = compute_fluency_signals(
        [],
        "I um enjoy uh reading like books you know every day.",
        10.0,
    )
    fc_clean = fluency_signals_to_fc_anchor(
        wpm_band=7.0,
        completeness_band=7.0,
        signals=clean,
        relevance_ratio=0.8,
        word_count=6,
        speaking_part="1",
    )
    fc_filler = fluency_signals_to_fc_anchor(
        wpm_band=7.0,
        completeness_band=7.0,
        signals=filler,
        relevance_ratio=0.8,
        word_count=10,
        speaking_part="1",
    )
    assert fc_filler < fc_clean


def test_grammar_anchor_shadowing_uses_wer() -> None:
    sig = compute_grammar_signals(
        "Technology has changed the way we communicate and work daily."
    )
    high_wer = grammar_signals_to_gra_anchor(
        sig, cefr="B2", wer_band=5.0, is_shadowing=True, word_count=10
    )
    low_wer = grammar_signals_to_gra_anchor(
        sig, cefr="B2", wer_band=8.0, is_shadowing=True, word_count=10
    )
    assert low_wer > high_wer


def test_prompt_relevance_overlap() -> None:
    r = prompt_relevance_ratio(
        "Do you enjoy reading books?",
        "Yes, I enjoy reading books because they help me relax.",
    )
    assert r >= 0.3

    off = prompt_relevance_ratio(
        "Do you enjoy reading books?",
        "I like playing football with my friends on weekends.",
    )
    assert off < r

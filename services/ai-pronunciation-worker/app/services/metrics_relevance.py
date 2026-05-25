"""Độ liên quan câu trả lời với đề (Part 1–3)."""

from __future__ import annotations

from app.services.metrics_wer import normalize_text

STOPWORDS = frozenset(
    """
    a an the is are was were be been being am do does did have has had
    i you he she it we they my your his her its our their me him them
    this that these those what which who whom whose where when why how
    in on at to for of with by from as and or but not no yes so if
    about into through during before after above below up down out
    very really just also than then there here can could would should
    will shall may might must
    """.split()
)


def _content_tokens(text: str) -> set[str]:
    words = normalize_text(text).split()
    return {w for w in words if len(w) > 2 and w not in STOPWORDS}


def prompt_relevance_ratio(prompt_text: str, hypothesis: str) -> float:
    """
    Tỷ lệ từ nội dung đề xuất hiện trong câu trả lời (0–1).
    Shadowing / đề quá ngắn → trả 1.0 (không penalise).
    """
    prompt_toks = _content_tokens(prompt_text)
    hyp_toks = _content_tokens(hypothesis)
    if not hyp_toks:
        return 0.0
    if len(prompt_toks) < 2:
        return 1.0
    overlap = prompt_toks & hyp_toks
    return min(1.0, len(overlap) / max(1, min(len(prompt_toks), 8)))

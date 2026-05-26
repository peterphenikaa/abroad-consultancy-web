"""Stage 4: RAG-augmented LLM feedback (tiếng Việt)."""

from __future__ import annotations

import logging

from app.config import Settings
from app.schemas import PronunciationDimensions, WordErrorItem

logger = logging.getLogger(__name__)


async def generate_feedback_vi(
    settings: Settings,
    *,
    reference_transcript: str,
    hypothesis_transcript: str,
    cefr_level: str,
    dimensions: PronunciationDimensions,
    word_errors: list[WordErrorItem],
    score_history: list[float],
) -> tuple[str | None, str | None]:
    """
    Returns (feedback_text, failure_reason).
    """
    if not settings.google_ai_api_key:
        return None, "Thiếu GOOGLE_AI_API_KEY — bỏ qua feedback LLM."

    errors_snip = ", ".join(e.word for e in word_errors[:8]) or "(không có)"
    hist = score_history[-5:] if score_history else []

    prompt = f"""Bạn là giáo viên phát âm tiếng Anh cho học viên Việt Nam (CAM_EDU).
Viết phản hồi tiếng Việt, 80–150 từ, thực tế, khích lệ.
Nêu 2–3 lỗi điển hình của người Việt nếu phù hợp (phụ âm cuối, /l/-/n/, intonation câu hỏi).

CEFR: {cefr_level}
Lịch sử điểm: {hist}
Script tham chiếu: {reference_transcript[:500]}
Học viên nói (ASR): {hypothesis_transcript[:500]}
WER band: {dimensions.wer.band}, Fluency: {dimensions.fluency.band}, Prosody: {dimensions.prosody.band}
Từ lỗi: {errors_snip}

Chỉ trả văn bản phản hồi, không markdown."""

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.google_ai_api_key)  # type: ignore[attr-defined]
        model = genai.GenerativeModel(settings.gemini_model)  # type: ignore[attr-defined]
        resp = model.generate_content(prompt)
        text = (resp.text or "").strip()
        if not text:
            return None, "Gemini trả về rỗng."
        return text[:800], None
    except Exception as e:
        logger.warning("Feedback LLM failed: %s", e)
        return None, str(e)

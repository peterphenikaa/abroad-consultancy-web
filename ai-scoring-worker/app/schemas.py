from typing import Any, Literal

from pydantic import BaseModel, Field


CefrLevel = Literal["A1", "A2", "B1", "B2", "C1", "C2"]
TaskType = Literal[1, 2]
CriterionCode = Literal["TA", "CC", "LR", "GRA"]


class EssayScoreRequest(BaseModel):
    """Đầu vào CAM_EDU AES — khớp đặc tả nghiên cứu (plain text + ngữ cảnh)."""

    essay_plaintext: str = Field(
        ...,
        description="Bài viết học sinh (plain text), gợi ý 150–350 từ.",
        min_length=1,
        max_length=50_000,
    )
    prompt_text: str = Field(..., description="Đề bài / prompt chính thức.")
    task_type: TaskType = Field(..., description="IELTS-style Task 1 hoặc Task 2.")
    cefr_level: CefrLevel = Field(..., description="Trình độ CEFR hiện tại của học viên.")
    writing_score_history: list[float] = Field(
        default_factory=list,
        description="Lịch sử điểm viết (band hoặc thang nội bộ), dùng cho cá nhân hóa sau này.",
    )


class DescriptorChunk(BaseModel):
    """Một đoạn descriptor CAM_EDU lấy từ RAG."""

    id: str | None = None
    text: str
    score: float | None = Field(None, description="Điểm liên quan từ vector DB nếu có.")


class RubricScores(BaseModel):
    """Bốn tiêu chí IELTS-style (0–9), sau này gắn DeBERTa / LLM rubric."""

    task_achievement: float = Field(..., ge=0, le=9)
    coherence_and_cohesion: float = Field(..., ge=0, le=9)
    lexical_resource: float = Field(..., ge=0, le=9)
    grammatical_range_and_accuracy: float = Field(..., ge=0, le=9)


class InlineAnnotation(BaseModel):
    start: int = Field(..., ge=0)
    end: int = Field(..., ge=0)
    criterion: CriterionCode
    color_token: str = Field(
        default="LR",
        description="Token màu UI (map TA/CC/LR/GRA → palette ở frontend).",
    )
    message: str


class ImprovementSuggestion(BaseModel):
    sentence_span: str = Field(..., description="Trích câu hoặc đoạn cần sửa.")
    suggestion: str
    cefr_aligned_example: str = Field(
        ...,
        description="Ví dụ cải thiện căn chỉnh CEFR (placeholder cho đến khi gắn LLM).",
    )


class PlagiarismReport(BaseModel):
    score_percent: float = Field(..., ge=0, le=100)
    suspected_sources: list[str] = Field(default_factory=list)


ScoringSource = Literal["gemini", "heuristic"]


class EssayScoreResponse(BaseModel):
    band_overall: float = Field(..., ge=0, le=9)
    scoring_source: ScoringSource = Field(
        ...,
        description="gemini = LLM rubric; heuristic = fallback (điểm dồn ~5.5–6 nếu Gemini lỗi).",
    )
    scoring_debug: dict[str, Any] | None = Field(
        default=None,
        description="Chi tiết audit khi AES_DEBUG_SCORING=true (server .env).",
    )
    scoring_fallback_reason: str | None = Field(
        default=None,
        description="Khi scoring_source=heuristic: lý do không dùng được Gemini (đọc để sửa cấu hình).",
    )
    rubric: RubricScores
    descriptors_retrieved: list[DescriptorChunk] = Field(
        default_factory=list,
        description="CAM_EDU band descriptors qua RAG (để audit / hiển thị nguồn).",
    )
    inline_annotations: list[InlineAnnotation]
    improvement_suggestions: list[ImprovementSuggestion]
    plagiarism: PlagiarismReport
    ai_generated_score: float = Field(
        ...,
        ge=0,
        le=1,
        description="Xác suất / điểm chuẩn hóa 0–1: bài do AI tạo.",
    )
    lexical_ttr: float | None = Field(
        None,
        description="Type–Token Ratio (LR), skeleton hiện tính từ spaCy.",
    )
    lexical_mtld: float | None = Field(
        None,
        description="MTLD (McCarthy & Jarvis), forward + partial factor cuối; token spaCy như TTR.",
    )

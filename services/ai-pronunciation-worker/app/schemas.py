from typing import Literal

from pydantic import BaseModel, Field


CefrLevel = Literal["A1", "A2", "B1", "B2", "C1", "C2"]
TargetAccent = Literal["british", "american"]
WordErrorType = Literal["substitution", "deletion", "insertion"]
ScoringSource = Literal["pipeline_v1", "heuristic"]
SpeakingPart = Literal["1", "2", "3", "shadowing"]
SpeakingScoringSource = Literal["pipeline_v1", "heuristic"]


class DimensionScore(BaseModel):
    """Một chiều điểm: metric thô + band 0–9."""

    value: float = Field(..., description="Giá trị metric (WER 0–1, WPM, PA 0–1, …).")
    band: float = Field(..., ge=0, le=9, description="Band CAM_EDU 0–9 cho chiều này.")


class WordErrorItem(BaseModel):
    word: str
    start_s: float | None = None
    end_s: float | None = None
    error_type: WordErrorType
    ipa_hint: str | None = None


class PronunciationDimensions(BaseModel):
    wer: DimensionScore
    fluency: DimensionScore
    prosody: DimensionScore
    completeness: DimensionScore
    phoneme_accuracy: DimensionScore | None = Field(
        None,
        description="PA = (1/K)Σ 1[p̂_k=p_k]·w_k — có sau khi bật MFA (phase 2).",
    )


class PronunciationScoreResponse(BaseModel):
    band_overall: float = Field(..., ge=0, le=9)
    scoring_source: ScoringSource
    dimensions: PronunciationDimensions
    hypothesis_transcript: str
    reference_transcript: str
    word_errors: list[WordErrorItem] = Field(default_factory=list)
    feedback_vi: str | None = Field(
        None,
        description="Phản hồi cá nhân hóa tiếng Việt (80–150 từ), Stage 4 LLM.",
    )
    audio_duration_s: float | None = None
    scoring_debug: dict[str, object] | None = None
    scoring_fallback_reason: str | None = None


class AsrSegment(BaseModel):
    """Word/segment từ Whisper — dùng nội bộ pipeline."""

    text: str
    start_s: float
    end_s: float


class SpeakingRubric(BaseModel):
    """IELTS Speaking — 4 tiêu chí (band 0–9, bước 0.5)."""

    fluency_and_coherence: float = Field(..., ge=0, le=9)
    lexical_resource: float = Field(..., ge=0, le=9)
    grammatical_range_and_accuracy: float = Field(..., ge=0, le=9)
    pronunciation: float = Field(..., ge=0, le=9)


class SpeakingImprovementSuggestion(BaseModel):
    excerpt: str = Field(..., description="Đoạn transcript học viên.")
    suggestion: str
    example: str | None = None


class SpeakingScoreResponse(BaseModel):
    """ASS — Automated Speaking Scoring (IELTS rubric + acoustic pronunciation)."""

    band_overall: float = Field(..., ge=0, le=9)
    scoring_source: SpeakingScoringSource
    speaking_rubric: SpeakingRubric
    pronunciation_dimensions: PronunciationDimensions
    hypothesis_transcript: str
    prompt_text: str
    reference_transcript: str | None = None
    speaking_part: SpeakingPart | None = None
    word_errors: list[WordErrorItem] = Field(default_factory=list)
    feedback_vi: str | None = None
    improvement_suggestions: list[SpeakingImprovementSuggestion] = Field(
        default_factory=list
    )
    audio_duration_s: float | None = None
    scoring_debug: dict[str, object] | None = None
    scoring_fallback_reason: str | None = None

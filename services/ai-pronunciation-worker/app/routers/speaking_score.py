import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.config import Settings, get_settings
from app.schemas import CefrLevel, SpeakingPart, SpeakingScoreResponse, TargetAccent
from app.services.speaking_pipeline import score_speaking

router = APIRouter(prefix="/ass", tags=["ass"])


@router.post("/score", response_model=SpeakingScoreResponse)
async def score_speaking_ielts(
    audio: UploadFile = File(..., description="WAV/WebM, 5–120 giây."),
    prompt_text: str = Form(
        ...,
        description="Câu hỏi / đề Speaking (Part 1–3) hoặc hướng dẫn bài shadowing.",
    ),
    cefr_level: CefrLevel = Form(..., description="A1 | A2 | B1 | B2 | C1 | C2"),
    target_accent: TargetAccent = Form("american"),
    speaking_part: SpeakingPart | None = Form(
        None,
        description="1 | 2 | 3 | shadowing — optional",
    ),
    reference_transcript: str = Form(
        "",
        description="Script tham chiếu (shadowing / read-aloud). Để trống nếu free response.",
    ),
    speaking_score_history_json: str = Form(
        "[]",
        description="JSON array band overall trước, ví dụ `[6.0, 6.5]`",
    ),
    settings: Settings = Depends(get_settings),
) -> SpeakingScoreResponse:
    """
    Chấm Speaking IELTS — 4 tiêu chí (FC, LR, GRA, Pronunciation) + metrics acoustic.
    """
    try:
        raw = json.loads(speaking_score_history_json)
        hist = [float(x) for x in raw] if isinstance(raw, list) else []
    except (json.JSONDecodeError, TypeError, ValueError):
        hist = []

    data = await audio.read()
    try:
        return await score_speaking(
            settings,
            audio_bytes=data,
            filename=audio.filename or "audio.wav",
            prompt_text=prompt_text,
            cefr_level=cefr_level,
            target_accent=target_accent,
            speaking_part=speaking_part,
            reference_transcript=reference_transcript or None,
            speaking_score_history=hist,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

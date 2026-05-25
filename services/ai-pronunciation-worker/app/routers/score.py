import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.config import Settings, get_settings
from app.schemas import CefrLevel, PronunciationScoreResponse, TargetAccent
from app.services.scoring_pipeline import score_pronunciation

router = APIRouter(prefix="/aps", tags=["aps"])


@router.post("/score", response_model=PronunciationScoreResponse)
async def score_speaking(
    audio: UploadFile = File(..., description="WAV/WebM, 5–120 giây."),
    reference_transcript: str = Form(
        ...,
        description="Script tham chiếu từ bài học (expected transcript).",
    ),
    cefr_level: CefrLevel = Form(..., description="A1 | A2 | B1 | B2 | C1 | C2"),
    target_accent: TargetAccent = Form(
        "american",
        description="british | american",
    ),
    pronunciation_score_history_json: str = Form(
        "[]",
        description="JSON array band trước, ví dụ `[6.0, 6.5]`",
    ),
    settings: Settings = Depends(get_settings),
) -> PronunciationScoreResponse:
    """
    Chấm phát âm CAM_EDU — pipeline 4 stage (Whisper → MFA* → metrics → LLM feedback).

    *MFA bật qua `MFA_ENABLED=true` (phase 2).
    """
    try:
        raw = json.loads(pronunciation_score_history_json)
        hist = [float(x) for x in raw] if isinstance(raw, list) else []
    except (json.JSONDecodeError, TypeError, ValueError):
        hist = []

    data = await audio.read()
    try:
        return await score_pronunciation(
            settings,
            audio_bytes=data,
            filename=audio.filename or "audio.wav",
            reference_transcript=reference_transcript,
            cefr_level=cefr_level,
            target_accent=target_accent,
            pronunciation_score_history=hist,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

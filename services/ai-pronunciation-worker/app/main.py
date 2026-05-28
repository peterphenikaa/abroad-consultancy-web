import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers.score import router as score_router
from app.routers.speaking_score import router as speaking_score_router

logging.basicConfig(level=logging.INFO)

_DEFAULT_CORS = (
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:80",
    "http://localhost:80",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
)


def _cors_origins() -> list[str]:
    s = get_settings()
    if s.aps_cors_origins and s.aps_cors_origins.strip():
        return [o.strip() for o in s.aps_cors_origins.split(",") if o.strip()]
    return list(_DEFAULT_CORS)


app = FastAPI(
    title="CAM_EDU Speaking Worker",
    version="0.2.0",
    description=(
        "APS: pronunciation vs script. ASS: IELTS Speaking rubric (FC, LR, GRA, P) "
        "+ Whisper + acoustic metrics + Gemini."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(score_router, prefix="/api/v1")
app.include_router(speaking_score_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/config/pipeline-status")
def pipeline_status() -> dict[str, bool | str | float]:
    """Dev: trạng thái pipeline (không lộ secret)."""
    s = get_settings()
    return {
        "whisper_model": s.whisper_model,
        "whisper_device": s.whisper_device,
        "mfa_enabled": s.mfa_enabled,
        "has_gemini": bool(s.google_ai_api_key),
        "gemini_model": s.gemini_model,
        "ass_gemini_use_audio": s.ass_gemini_use_audio,
        "audio_min_duration_s": s.audio_min_duration_s,
        "audio_max_duration_s": s.audio_max_duration_s,
        "has_rag_service_url": bool(s.aps_rag_service_url),
    }

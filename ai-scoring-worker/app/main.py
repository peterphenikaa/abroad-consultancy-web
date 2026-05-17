import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers.score import router as score_router

logging.basicConfig(level=logging.INFO)

_DEFAULT_CORS = (
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
)


def _cors_origins() -> list[str]:
    s = get_settings()
    if s.aes_cors_origins and s.aes_cors_origins.strip():
        return [o.strip() for o in s.aes_cors_origins.split(",") if o.strip()]
    return list(_DEFAULT_CORS)


app = FastAPI(
    title="CAM_EDU AES Worker",
    version="0.1.0",
    description="Automated Essay Scoring: FastAPI + RAG rubric + Gemini hybrid (TTR+LR).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(score_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/config/rag-status")
def rag_status() -> dict[str, bool | str | int | None]:
    """Tiện ích dev: xem RAG đang bật kênh nào (không lộ secret)."""
    s = get_settings()
    mode = "none"
    if s.aes_rag_service_url:
        mode = "http"
    elif s.pinecone_api_key and s.pinecone_index_name:
        if s.openai_api_key:
            mode = "pinecone+openai"
        elif s.google_ai_api_key:
            mode = "pinecone+gemini-embed"
    return {
        "mode": mode,
        "has_rag_service_url": bool(s.aes_rag_service_url),
        "has_pinecone": bool(s.pinecone_api_key and s.pinecone_index_name),
        "has_openai": bool(s.openai_api_key),
        "pinecone_index": s.pinecone_index_name,
        "has_gemini": bool(s.google_ai_api_key),
        "gemini_model": s.gemini_model,
        "gemini_embedding_model": s.gemini_embedding_model,
        "gemini_embedding_output_dimensionality": s.gemini_embedding_output_dimensionality,
    }

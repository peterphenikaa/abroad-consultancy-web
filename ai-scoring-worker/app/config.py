from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_gemini_generate_model_id(raw: str | None) -> str:
    """
    generateContent / GenerativeModel: ID dạng 'gemini-2.5-flash' — KHÔNG dùng tiền tố 'models/'.
    Nếu .env lỡ đặt GEMINI_MODEL=models/gemini-2.5-flash → API 400 unexpected model name format.
    """
    if raw is None:
        return "gemini-2.5-flash"
    s = str(raw).strip()
    if not s:
        return "gemini-2.5-flash"
    # Ghi chú dính cùng dòng trong .env: GEMINI_MODEL=gemini-2.5-flash# nhận xét → vài parser giữ cả phần sau #
    if "#" in s:
        s = s.split("#", 1)[0].strip()
    if not s:
        return "gemini-2.5-flash"
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip()
    if s.startswith("models/"):
        s = s[len("models/") :].lstrip("/")
    return s or "gemini-2.5-flash"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # RAG: ưu tiên gọi service HTTP nếu có (đồng bộ với stack Node hoặc gateway)
    aes_rag_service_url: str | None = None
    aes_rag_service_timeout_s: float = 15.0

    # RAG trực tiếp Pinecone + OpenAI embedding (text-embedding-3-small)
    pinecone_api_key: str | None = None
    pinecone_index_name: str | None = None
    openai_api_key: str | None = None
    openai_embedding_model: str = "text-embedding-3-small"
    openai_base_url: str | None = None

    # Namespace / filter metadata (tùy chỉnh theo index thật)
    pinecone_namespace: str | None = None

    # Gemini (IELTS-style rubric + nhận xét; GRA tạm thời nếu chưa có DeBERTa)
    google_ai_api_key: str | None = None
    # Chấm bài (generateContent): chỉ ID dạng gemini-2.5-flash — không dùng tiền tố models/ (xem normalize bên dưới).
    gemini_model: str = "gemini-2.5-flash"
    # Pinecone vector: khi không có OPENAI_API_KEY — embedContent v1beta dùng gemini-embedding-001
    # (text-embedding-004 thường 404). output_dimensionality=768 khớp index cũ 768 chiều; 0 = bỏ qua (vector đầy đủ ~3072).
    gemini_embedding_model: str = "models/gemini-embedding-001"
    gemini_embedding_output_dimensionality: int = 768

    # CORS: danh sách origin cách nhau bởi dấu phẩy; rỗng = mặc định dev (Vite 5173, …)
    aes_cors_origins: str | None = None

    # Trả thêm scoring_debug trong JSON response (raw key JSON, anchor, …) để audit
    aes_debug_scoring: bool = False

    @field_validator("gemini_model", mode="before")
    @classmethod
    def _normalize_gemini_model(cls, v: object) -> str:
        if isinstance(v, str):
            return normalize_gemini_generate_model_id(v)
        if v is None:
            return normalize_gemini_generate_model_id(None)
        return normalize_gemini_generate_model_id(str(v))


@lru_cache
def get_settings() -> Settings:
    return Settings()

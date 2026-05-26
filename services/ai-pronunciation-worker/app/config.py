from pathlib import Path
from typing import ClassVar

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_SERVICE_ROOT = Path(__file__).resolve().parents[1]
_REPO_ROOT = Path(__file__).resolve().parents[3]


def _env_file_paths() -> tuple[str, ...]:
    """Worker .env trước, repo root .env sau (Docker/monorepo thường để key ở root)."""
    paths: list[Path] = [_SERVICE_ROOT / ".env", _REPO_ROOT / ".env"]
    out = [str(p) for p in paths if p.is_file()]
    return tuple(out) if out else (".env",)


def normalize_gemini_generate_model_id(raw: str | None) -> str:
    if raw is None:
        return "gemini-2.5-flash"
    s = str(raw).strip()
    if not s:
        return "gemini-2.5-flash"
    if "#" in s:
        s = s.split("#", 1)[0].strip()
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip()
    if s.startswith("models/"):
        s = s[len("models/") :].lstrip("/")
    return s or "gemini-2.5-flash"


class Settings(BaseSettings):
    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file=_env_file_paths(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Stage 1: ASR (Whisper) ---
    whisper_model: str = "small"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"

    # --- Stage 2: MFA (phase 2 — optional paths) ---
    mfa_enabled: bool = False
    mfa_acoustic_model: str | None = None
    mfa_dictionary: str | None = None

    # --- Stage 4: LLM feedback ---
    google_ai_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    aps_rag_service_url: str | None = None
    aps_rag_service_timeout_s: float = 15.0

    # --- Audio constraints (paper: 5–120s) ---
    audio_min_duration_s: float = 5.0
    audio_max_duration_s: float = 120.0
    audio_max_bytes: int = 25_000_000

    # --- Scoring ---
    target_accent_default: str = "american"
    vi_phoneme_weights_path: str = "data/vi_phoneme_weights.json"

    aps_cors_origins: str | None = None
    aps_debug_scoring: bool = False

    # ASS: Gemini multimodal (audio + transcript) khi có API key
    ass_gemini_use_audio: bool = True

    @field_validator("gemini_model", mode="before")
    @classmethod
    def _normalize_gemini_model(cls, v: object) -> str:
        if isinstance(v, str):
            return normalize_gemini_generate_model_id(v)
        if v is None:
            return normalize_gemini_generate_model_id(None)
        return normalize_gemini_generate_model_id(str(v))


def get_settings() -> Settings:
    """Đọc Settings mỗi lần gọi — .env đổi không cần restart (dev)."""
    return Settings()

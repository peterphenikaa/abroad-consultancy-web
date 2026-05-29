from pathlib import Path
from typing import ClassVar

from pydantic_settings import BaseSettings, SettingsConfigDict

_SERVICE_ROOT = Path(__file__).resolve().parents[1]
_REPO_ROOT = Path(__file__).resolve().parents[3]


def _env_file_paths() -> tuple[str, ...]:
    paths = [_SERVICE_ROOT / ".env", _REPO_ROOT / ".env"]
    return tuple(str(p) for p in paths if p.is_file()) or (".env",)


class Settings(BaseSettings):
    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file=_env_file_paths(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    crawler_database_url: str
    elasticsearch_node: str
    search_index: str = "study_abroad_data"
    search_port: int = 3007


def get_settings() -> Settings:
    # Giá trị bắt buộc lấy từ .env / biến môi trường, không truyền qua constructor.
    return Settings()  # pyright: ignore[reportCallIssue]

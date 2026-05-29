from typing import Any, Literal

from pydantic import BaseModel

__all__ = [
    "SearchHit",
    "SearchResponse",
    "SyncResponse",
    "HealthResponse",
    "StatusResponse",
]


class SearchHit(BaseModel):
    score: float | None = None
    data: dict[str, Any]


class SearchResponse(BaseModel):
    results: list[SearchHit]
    total: int


class SyncResponse(BaseModel):
    message: str
    count: int = 0


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


class StatusResponse(BaseModel):
    opensearch_configured: bool
    postgres_configured: bool
    index: str

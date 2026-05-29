from __future__ import annotations

from typing import Any

from opensearchpy import OpenSearch

from app.config import Settings
from app.schemas import SearchHit, SearchResponse


def _extract_hits(raw: dict[str, Any]) -> list[dict[str, Any]]:
    """OpenSearch-py trả hits trực tiếp; client cũ có thể bọc trong body."""
    if "hits" in raw and isinstance(raw["hits"], dict):
        return raw["hits"].get("hits", [])
    body = raw.get("body")
    if isinstance(body, dict):
        return body.get("hits", {}).get("hits", [])
    return []


def search_documents(settings: Settings, client: OpenSearch, query: str) -> SearchResponse:
    result = client.search(
        index=settings.search_index,
        body={
            "query": {
                "multi_match": {
                    "query": query,
                    "fields": ["title^3", "content", "location"],
                }
            }
        },
    )

    hits = [
        SearchHit(score=h.get("_score"), data=h.get("_source") or {})
        for h in _extract_hits(result)
    ]
    return SearchResponse(results=hits, total=len(hits))

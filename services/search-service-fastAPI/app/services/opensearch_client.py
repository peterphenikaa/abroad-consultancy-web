from __future__ import annotations

from opensearchpy import OpenSearch

from app.config import Settings

_client: OpenSearch | None = None


def get_opensearch(settings: Settings) -> OpenSearch:
    global _client
    if _client is not None:
        return _client

    node = settings.elasticsearch_node.strip()
    _client = OpenSearch(
        hosts=[node],
        use_ssl=node.startswith("https://"),
        verify_certs=True,
    )
    return _client


def reset_client() -> None:
    """Dùng trong test — reset singleton."""
    global _client
    _client = None

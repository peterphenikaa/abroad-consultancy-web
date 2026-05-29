from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import Settings, get_settings
from app.schemas import SearchResponse
from app.services.opensearch_client import get_opensearch
from app.services.search_service import search_documents

router = APIRouter(tags=["search"])


@router.get("/api/search", response_model=SearchResponse)
def search(
    q: str = Query(..., min_length=1, description="Từ khóa tìm kiếm"),
    settings: Settings = Depends(get_settings),
) -> SearchResponse:
    """Full-text search trên index study_abroad (university + visa)."""
    try:
        client = get_opensearch(settings)
        return search_documents(settings, client, q.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

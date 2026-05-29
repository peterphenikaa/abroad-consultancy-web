from fastapi import APIRouter, Depends, HTTPException

from app.config import Settings, get_settings
from app.schemas import SyncResponse
from app.services.opensearch_client import get_opensearch
from app.services.sync_service import sync_postgres_to_opensearch

router = APIRouter(tags=["sync"])


@router.post("/api/sync", response_model=SyncResponse)
def sync_data(settings: Settings = Depends(get_settings)) -> SyncResponse:
    """Đồng bộ PostgreSQL (crawler schema) → OpenSearch."""
    try:
        client = get_opensearch(settings)
        count = sync_postgres_to_opensearch(settings, client)
        if count == 0:
            return SyncResponse(message="Không có dữ liệu để đồng bộ", count=0)
        return SyncResponse(
            message="Đồng bộ thành công!",
            count=count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

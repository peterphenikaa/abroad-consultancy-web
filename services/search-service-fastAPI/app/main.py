import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers.search import router as search_router
from app.routers.sync import router as sync_router
from app.schemas import HealthResponse, StatusResponse

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="CAM_EDU Search Service",
    version="1.0.0",
    description="Full-text search study abroad data (PostgreSQL crawler → OpenSearch).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)
app.include_router(sync_router)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()


@app.get("/config/status", response_model=StatusResponse)
def status() -> StatusResponse:
    s = get_settings()
    return StatusResponse(
        opensearch_configured=bool(s.elasticsearch_node),
        postgres_configured=bool(s.crawler_database_url),
        index=s.search_index,
    )

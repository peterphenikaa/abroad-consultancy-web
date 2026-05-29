# search-service (FastAPI) — ACTIVE

Service tìm kiếm full-text (OpenSearch) — **phiên bản đang dùng** trong monorepo.

| Công nghệ | Python 3.12, FastAPI, opensearch-py, psycopg |
|-----------|-----------------------------------------------|
| Port | **3007** |
| Docker | `docker-compose` → `build: ./services/search-service` |

## Chạy local

```powershell
cd services/search-service
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --port 3007 --reload
```

Swagger: http://127.0.0.1:3007/docs

## Env

`CRAWLER_DATABASE_URL`, `ELASTICSEARCH_NODE` — xem `.env.example`.

## Phiên bản Node cũ (không dùng)

Lưu tại [`../search-service-node-legacy`](../search-service-node-legacy) — chỉ tham khảo.

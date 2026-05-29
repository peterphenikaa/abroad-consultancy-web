# Test Search Service bằng Postman

## 1. Chạy service

```powershell
cd D:\LongWork\prj_tieng\abroad-consultancy-web
.\.venv\Scripts\Activate.ps1
cd services\search-service-fastAPI
pip install -r requirements.txt
py -m uvicorn app.main:app --port 3007 --reload
```

File `.env` ở **thư mục gốc repo** cần có:

- `CRAWLER_DATABASE_URL`
- `ELASTICSEARCH_NODE`

## 2. Import collection

1. Postman → **Import**
2. Chọn file: `postman/CAM_EDU_Search_Service.postman_collection.json`
3. Biến `baseUrl` mặc định: `http://127.0.0.1:3007`

## 3. Thứ tự gọi API

| Bước | Request | Kỳ vọng |
|------|---------|---------|
| 1 | `GET /health` | `{ "status": "ok" }` |
| 2 | `GET /config/status` | `opensearch_configured: true`, `postgres_configured: true` |
| 3 | **`POST /api/sync`** | `{ "message": "Đồng bộ thành công!", "count": N }` |
| 4 | `GET /api/search?q=university` | `results` có item, `total` > 0 |

**Lưu ý:** Bỏ qua bước 3 → search thường trả `total: 0`.

## 4. Gợi ý từ khóa `q`

- `university`, `visa`, `Australia`, `study`
- Tên trường / nội dung có trong bảng crawler

## 5. Lỗi thường gặp

| Status | Nguyên nhân |
|--------|-------------|
| Could not send request | Service chưa chạy port 3007 |
| 500 `/api/sync` | Sai DB URL hoặc không có schema `crawler` |
| 500 `/api/search` | Sai OpenSearch URL |
| 200 nhưng `total: 0` | Chưa sync hoặc `q` không khớp dữ liệu |

## 6. Swagger (thay Postman)

http://127.0.0.1:3007/docs

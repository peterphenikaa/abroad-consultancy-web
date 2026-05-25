# Hướng dẫn test API bằng Postman (cho người mới)

Tài liệu này hướng dẫn từng bước test **Speaking Worker** — service chấm phát âm và IELTS Speaking trên máy local.

**Không cần biết code.** Chỉ cần cài Postman, chạy server, gửi request.

---

## 1. Bạn cần chuẩn bị gì?

| Thứ | Mô tả |
|-----|--------|
| **Postman** | Tải miễn phí: https://www.postman.com/downloads/ |
| **Python** | Đã cài trên máy (dùng lệnh `py`) |
| **Server đang chạy** | Worker lắng nghe port `8089` |
| **File audio mẫu** | `tests/fixtures/audio/01_greeting.wav` |

---

## 2. Khởi động server (bước bắt buộc)

Mở **PowerShell** hoặc **Terminal**, chạy:

```powershell
cd d:\LongWork\prj_tieng\abroad-consultancy-web\services\ai-pronunciation-worker
py -m uvicorn app.main:app --port 8089 --reload
```

Thấy dòng sau là **OK**:

```
INFO:     Uvicorn running on http://127.0.0.1:8089 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

> **Lưu ý:** Cửa sổ terminal phải **mở suốt**. Tắt terminal = server tắt = Postman không gọi được API.

---

## 3. Kiểm tra server sống (trước khi dùng Postman)

Mở trình duyệt, vào:

```
http://127.0.0.1:8089/health
```

Phải thấy:

```json
{"status":"ok"}
```

### Mở `http://127.0.0.1:8089/` bị lỗi?

Trả về `{"detail":"Not Found"}` là **bình thường** — không có trang chủ. Dùng các URL sau:

| URL | Mục đích |
|-----|----------|
| `/health` | Kiểm tra server |
| `/docs` | Giao diện Swagger (test trên browser) |
| `/config/pipeline-status` | Xem Whisper/Gemini đã sẵn sàng chưa |

---

## 4. Cài đặt Postman (chỉ làm 1 lần)

### 4.1 Tăng timeout (quan trọng)

API chấm điểm mất **30–90 giây** (Whisper + Gemini). Mặc định Postman timeout 0 hoặc quá ngắn sẽ báo lỗi giả.

1. Postman → góc trên phải **⚙ Settings**
2. Tab **General**
3. **Request timeout in ms** → nhập `120000` (2 phút)
4. **Save**

### 4.2 Import collection có sẵn (khuyến nghị)

1. Postman → **Import** (góc trên trái)
2. Chọn file:

   ```
   services/ai-pronunciation-worker/postman/CAM_EDU_Speaking_Worker.postman_collection.json
   ```

3. Bấm **Import**

Collection **CAM_EDU Speaking Worker** xuất hiện bên trái, gồm sẵn các request.

---

## 5. Test request đầu tiên — GET Health

1. Mở collection → **Health & Config** → **GET Health**
2. URL hiển thị: `http://127.0.0.1:8089/health`
3. Bấm **Send**
4. Kết quả:
   - **Status: 200 OK**
   - Body: `{"status":"ok"}`

Nếu bước này fail → xem [Mục 9 — Xử lý lỗi](#9-xử-lý-lỗi-thường-gặp).

---

## 6. Test chấm IELTS Speaking (ASS) — bài dễ nhất

Đây là API chính: trả **band IELTS** (FC, LR, GRA, Pronunciation) + feedback tiếng Việt.

### 6.1 Thông tin request

| Mục | Giá trị |
|-----|---------|
| Method | **POST** |
| URL | `http://127.0.0.1:8089/api/v1/ass/score` |
| Body type | **form-data** (không dùng raw JSON) |

### 6.2 Các field trong Body (form-data)

Vào tab **Body** → chọn **form-data** → điền:

| KEY | TYPE | VALUE (copy vào) |
|-----|------|------------------|
| `audio` | **File** ⚠️ | Chọn file `01_greeting.wav` |
| `prompt_text` | Text | `Please read the following sentence aloud clearly.` |
| `reference_transcript` | Text | `Hello, my name is Linh and I am learning English pronunciation every day.` |
| `cefr_level` | Text | `A2` |
| `speaking_part` | Text | `shadowing` |
| `target_accent` | Text | `american` |

#### ⚠️ Field `audio` phải là File

1. Ở cột **KEY**, gõ `audio`
2. Ở cột bên phải (Type), đổi từ **Text** → **File**
3. Bấm **Select Files** → chọn:

   ```
   services/ai-pronunciation-worker/tests/fixtures/audio/01_greeting.wav
   ```

Nếu để Type = Text → server báo lỗi 422.

### 6.3 Gửi request

1. Bấm **Send**
2. Thanh dưới hiển thị **Sending request...** — **đừng bấm lại**, đợi 30–90 giây
3. Lần đầu có thể lâu hơn (Whisper tải model)

Terminal server sẽ in dòng tương tự:

```
INFO: ... "POST /api/v1/ass/score HTTP/1.1" 200 OK
```

### 6.4 Response thành công (200 OK)

Ví dụ rút gọn:

```json
{
  "band_overall": 6.5,
  "scoring_source": "pipeline_v1",
  "speaking_rubric": {
    "fluency_and_coherence": 6.5,
    "lexical_resource": 6.0,
    "grammatical_range_and_accuracy": 6.5,
    "pronunciation": 7.0
  },
  "hypothesis_transcript": "Hello, my name is Linh...",
  "feedback_vi": "Bạn phát âm khá rõ ràng...",
  "improvement_suggestions": [...]
}
```

| Field | Ý nghĩa |
|-------|---------|
| `band_overall` | Band tổng IELTS (bước 0.5) |
| `scoring_source` | `pipeline_v1` = có Gemini; `heuristic` = chấm cơ bản, thiếu key |
| `speaking_rubric` | 4 tiêu chí IELTS Speaking |
| `feedback_vi` | Nhận xét tiếng Việt |
| `hypothesis_transcript` | Text Whisper nghe được từ audio |

---

## 7. Test chấm phát âm (APS) — đơn giản hơn ASS

Dùng khi chỉ cần **band phát âm + WER** so với script, không cần 4 tiêu chí IELTS.

| Mục | Giá trị |
|-----|---------|
| Method | **POST** |
| URL | `http://127.0.0.1:8089/api/v1/aps/score` |
| Body | **form-data** |

| KEY | TYPE | VALUE |
|-----|------|-------|
| `audio` | File | `01_greeting.wav` |
| `reference_transcript` | Text | `Hello, my name is Linh and I am learning English pronunciation every day.` |
| `cefr_level` | Text | `A2` |
| `target_accent` | Text | `american` |

Response có `band_overall`, `pronunciation_dimensions` (wer, fluency, prosody...).

---

## 8. Các kịch bản test khác

### Part 1 — trả lời tự do (không có script)

| KEY | VALUE |
|-----|-------|
| `audio` | File ghi âm câu trả lời (≥ 5 giây) |
| `prompt_text` | `Do you enjoy reading books? Why or why not?` |
| `cefr_level` | `B1` |
| `speaking_part` | `1` |
| `reference_transcript` | *(để trống hoặc xóa field)* |

### Part 2 — cue card (monologue)

| KEY | VALUE |
|-----|-------|
| `prompt_text` | `Describe a book you read recently. You should say: what it was about, why you chose it, and whether you would recommend it.` |
| `speaking_part` | `2` |
| `cefr_level` | `B2` |
| `audio` | File ghi âm 30–120 giây |

---

## 9. Xử lý lỗi thường gặp

### "Could not get response" / timeout

| Nguyên nhân | Cách sửa |
|-------------|----------|
| Timeout Postman quá ngắn | Settings → timeout = `120000` ms |
| Server chưa chạy | Chạy lại lệnh uvicorn (Mục 2) |
| Đang xử lý lần đầu | Đợi thêm 1–2 phút (load Whisper) |

### Status 422 Unprocessable Entity

| Nguyên nhân | Cách sửa |
|-------------|----------|
| Thiếu field bắt buộc | Thêm `audio`, `prompt_text`, `cefr_level` |
| `audio` là Text thay vì File | Đổi Type → **File** |
| Audio quá ngắn (< 5s) | Dùng file dài hơn |
| Audio quá dài (> 120s) | Cắt ngắn file |

### Status 503 Service Unavailable

Whisper hoặc Gemini lỗi. Kiểm tra:

```
GET http://127.0.0.1:8089/config/pipeline-status
```

- `has_gemini: false` → thêm `GOOGLE_AI_API_KEY` vào file `.env`, restart server
- Xem log terminal để biết lỗi chi tiết

### Terminal không có dòng POST sau khi Send

Request **chưa tới server**. Kiểm tra:

- URL đúng `http://127.0.0.1:8089/...` (không thiếu `/api/v1`)
- Không dùng `https://`
- Firewall/antivirus không chặn localhost

### `scoring_source: "heuristic"` thay vì `pipeline_v1`

Gemini chưa hoạt động. Vẫn có kết quả nhưng độ chính xác thấp hơn. Sửa `.env`:

```env
GOOGLE_AI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
ASS_GEMINI_USE_AUDIO=true
```

Restart server (Ctrl+C rồi chạy lại uvicorn).

---

## 10. Checklist hoàn thành

- [ ] Server chạy, `/health` trả `ok`
- [ ] Postman timeout ≥ 120 giây
- [ ] GET Health → 200 OK
- [ ] POST ASS score (shadowing + `01_greeting.wav`) → 200 OK
- [ ] Response có `band_overall` và `feedback_vi`
- [ ] `scoring_source` = `pipeline_v1` (nếu đã cấu hình Gemini)

---

## 11. Tài liệu thêm

| Tài liệu | Đường dẫn |
|----------|-----------|
| Contract API đầy đủ | `services/ai-pronunciation-worker/API.md` |
| Swagger UI (test trên browser) | http://127.0.0.1:8089/docs |
| Collection Postman | `postman/CAM_EDU_Speaking_Worker.postman_collection.json` |
| File audio mẫu | `tests/fixtures/audio/` (8 file) |
| Danh sách script mẫu | `tests/fixtures/manifest.json` |

---

## 12. So sánh nhanh 2 API

| | **APS** `/api/v1/aps/score` | **ASS** `/api/v1/ass/score` |
|--|---------------------------|---------------------------|
| Mục đích | Chấm phát âm vs script | Chấm IELTS Speaking đủ 4 tiêu chí |
| Bắt buộc | `audio`, `reference_transcript`, `cefr_level` | `audio`, `prompt_text`, `cefr_level` |
| Kết quả | Band phát âm + WER | FC, LR, GRA, P + feedback VI |
| Dùng khi | Shadowing, luyện đọc theo script | Part 1/2/3, mock Speaking |

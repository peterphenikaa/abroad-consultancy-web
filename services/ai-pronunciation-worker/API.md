# APS / ASS — API contract (Frontend / Course integration)

Worker chấm Speaking CAM_EDU. **APS** = phát âm theo script. **ASS** = IELTS Speaking 4 tiêu chí. Phiên bản **0.2.0**.

> **Test bằng Postman (người mới):** xem [postman/HUONG_DAN_POSTMAN.md](./postman/HUONG_DAN_POSTMAN.md) và import collection [postman/CAM_EDU_Speaking_Worker.postman_collection.json](./postman/CAM_EDU_Speaking_Worker.postman_collection.json).

## Base URL

| Môi trường | APS (phát âm) | ASS (IELTS Speaking) |
|------------|---------------|----------------------|
| Worker trực tiếp | `http://127.0.0.1:8089/api/v1/aps` | `http://127.0.0.1:8089/api/v1/ass` |
| Vite dev proxy | `/api/v1/aps` | `/api/v1/ass` |
| API Gateway | `http://localhost:8081/api/v1/aps` | `http://localhost:8081/api/v1/ass` |

Gateway và Vite proxy **không yêu cầu JWT** (route `/api/v1/*` public).

---

## Endpoints

### `GET /health`

```json
{ "status": "ok" }
```

### `GET /config/pipeline-status`

Trạng thái pipeline (dev/ops). Không trả secret.

```json
{
  "whisper_model": "small",
  "whisper_device": "cpu",
  "mfa_enabled": false,
  "has_gemini": true,
  "gemini_model": "gemini-2.5-flash",
  "audio_min_duration_s": 5.0,
  "audio_max_duration_s": 120.0,
  "has_rag_service_url": false
}
```

### `POST /api/v1/aps/score`

Chấm một clip speaking so với script tham chiếu.

**Content-Type:** `multipart/form-data`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|----------|------|--------|
| `audio` | ✅ | file | WAV, WebM, MP3, OGG, M4A, FLAC. **5–120 giây**, max ~25 MB |
| `reference_transcript` | ✅ | string | Script expected từ bài học (tiếng Anh) |
| `cefr_level` | ✅ | enum | `A1` \| `A2` \| `B1` \| `B2` \| `C1` \| `C2` |
| `target_accent` | ❌ | enum | `american` (default) \| `british` |
| `pronunciation_score_history_json` | ❌ | string | JSON array band trước, ví dụ `"[6.0, 6.5]"` |

#### Mapping từ course content

```javascript
const metadata = contentItem.metadata || {};
const reference_transcript = metadata.prompt || metadata.script || "";
const cefr_level = metadata.cefrLevel || courseLevel || "B1";
```

`PracticeSpeakingPlayer` hiện chưa gọi API — FE cần:

1. Ghi âm → `Blob` (WebM/WAV)
2. `FormData` + `fetch`
3. Hiển thị `band_overall`, `dimensions`, `feedback_vi`, `word_errors`

#### Ví dụ `fetch` (browser)

```javascript
const form = new FormData();
form.append("audio", audioBlob, "recording.webm");
form.append("reference_transcript", promptText);
form.append("cefr_level", "B1");
form.append("target_accent", "american");
form.append("pronunciation_score_history_json", JSON.stringify(history));

const base =
  import.meta.env.VITE_APS_WORKER_URL?.replace(/\/$/, "") ||
  "/api/v1/aps";

const res = await fetch(`${base}/score`, {
  method: "POST",
  body: form,
});
const data = await res.json();
```

**Timeout client:** khuyến nghị **≥ 120s** (Whisper CPU chậm).

#### Response `200` — `PronunciationScoreResponse`

```typescript
type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type ScoringSource = "pipeline_v1" | "heuristic";

interface DimensionScore {
  value: number;   // metric thô (WER 0–1, WPM, …)
  band: number;    // 0–9, bước 0.5
}

interface WordErrorItem {
  word: string;
  start_s?: number | null;
  end_s?: number | null;
  error_type: "substitution" | "deletion" | "insertion";
  ipa_hint?: string | null;
}

interface PronunciationScoreResponse {
  band_overall: number;
  scoring_source: ScoringSource;
  dimensions: {
    wer: DimensionScore;
    fluency: DimensionScore;
    prosody: DimensionScore;
    completeness: DimensionScore;
    phoneme_accuracy?: DimensionScore | null;  // null khi MFA tắt
  };
  hypothesis_transcript: string;   // ASR (Whisper)
  reference_transcript: string;
  word_errors: WordErrorItem[];
  feedback_vi?: string | null;     // Gemini, tiếng Việt
  audio_duration_s?: number | null;
  scoring_debug?: object | null;   // chỉ khi APS_DEBUG_SCORING=true
  scoring_fallback_reason?: string | null;
}
```

#### Band overall

Weighted fusion (MVP, MFA tắt — PA bỏ qua, weight chia lại):

| Chiều | Weight |
|-------|--------|
| WER | 30% |
| Fluency | 25% |
| Prosody | 20% |
| Completeness | 15% |
| Phoneme accuracy | 10% (khi MFA bật) |

Làm tròn IELTS **0.5** (6.7 → 6.5, 6.8 → 7.0).

#### Lỗi HTTP

| Code | Ý nghĩa |
|------|---------|
| `422` | Audio/script không hợp lệ (quá ngắn, format sai, transcript trống) |
| `503` | ASR/model lỗi runtime |
| `502` | Gateway không reach worker |

Body FastAPI thường: `{ "detail": "…" }`.

---

## E2E local (QA)

```powershell
cd services/ai-pronunciation-worker
py -m pip install -r requirements.txt -r requirements-dev.txt
py scripts/generate_audio_fixtures.py    # 8 clip TTS (edge-tts + imageio-ffmpeg)
py -m uvicorn app.main:app --port 8089   # terminal khác
py scripts/e2e_local.py
py scripts/e2e_local.py --base-url http://127.0.0.1:8081/api/v1/aps
py -m pytest tests/test_e2e_pipeline.py -q   # mock ASR, không cần Whisper
```

---

## Env (worker)

Xem `.env.example`. Bắt buộc runtime:

- **ffmpeg** trên PATH (pydub)
- **Whisper model** tải lần đầu (faster-whisper)

Tuỳ chọn:

- `GOOGLE_AI_API_KEY` — **bắt buộc cho độ chính xác cao** (`pipeline_v1` + audio multimodal). Thiếu key → heuristic acoustic/NLP (pause, filler, TTR, grammar anchor).
- `ASS_GEMINI_USE_AUDIO=true` — gửi file WAV kèm transcript cho Gemini (mặc định bật).

---

## ASS — IELTS Speaking (`POST /api/v1/ass/score`)

Chấm **4 tiêu chí IELTS Speaking** + metrics phát âm acoustic.

**Content-Type:** `multipart/form-data`

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|----------|------|--------|
| `audio` | ✅ | file | WAV, WebM, … **5–120 giây** |
| `prompt_text` | ✅ | string | Câu hỏi / đề (Part 1–3) hoặc hướng dẫn shadowing |
| `cefr_level` | ✅ | enum | `A1` … `C2` |
| `target_accent` | ❌ | enum | `american` \| `british` |
| `speaking_part` | ❌ | enum | `1` \| `2` \| `3` \| `shadowing` |
| `reference_transcript` | ❌ | string | Script (shadowing). Để trống = free response |
| `speaking_score_history_json` | ❌ | string | JSON array band trước |

#### Response `SpeakingScoreResponse`

```typescript
interface SpeakingRubric {
  fluency_and_coherence: number;
  lexical_resource: number;
  grammatical_range_and_accuracy: number;
  pronunciation: number;
}

interface SpeakingScoreResponse {
  band_overall: number;           // trung bình 4 tiêu chí, bước 0.5
  scoring_source: "pipeline_v1" | "heuristic";
  speaking_rubric: SpeakingRubric;
  pronunciation_dimensions: { wer; fluency; prosody; completeness; phoneme_accuracy? };
  hypothesis_transcript: string;
  prompt_text: string;
  reference_transcript?: string | null;
  speaking_part?: "1" | "2" | "3" | "shadowing" | null;
  word_errors: WordErrorItem[];
  feedback_vi?: string | null;
  improvement_suggestions: { excerpt; suggestion; example? }[];
  audio_duration_s?: number;
  scoring_fallback_reason?: string | null;
}
```

#### Ví dụ `fetch` — Part 1 (free response)

```javascript
const form = new FormData();
form.append("audio", audioBlob, "recording.webm");
form.append("prompt_text", "Do you enjoy reading books? Why or why not?");
form.append("cefr_level", "B1");
form.append("speaking_part", "1");

const res = await fetch("/api/v1/ass/score", { method: "POST", body: form });
const data = await res.json();
// data.speaking_rubric.fluency_and_coherence, data.band_overall, …
```

#### Shadowing (có script)

```javascript
form.append("prompt_text", "Read the sentence aloud clearly.");
form.append("reference_transcript", metadata.script);
form.append("speaking_part", "shadowing");
```

| API | Dùng khi |
|-----|----------|
| `/api/v1/aps/score` | Chỉ cần band phát âm + WER vs script |
| `/api/v1/ass/score` | Cần band IELTS đủ FC, LR, GRA, P |

---

## OpenAPI

Swagger UI: `http://127.0.0.1:8089/docs`

Schema Pydantic: `app/schemas.py`.

import json

from fastapi import APIRouter, Depends, Form

from app.config import Settings, get_settings
from app.schemas import EssayScoreRequest, EssayScoreResponse
from app.services.scoring_pipeline import score_essay

router = APIRouter(prefix="/aes", tags=["aes"])


@router.post("/score", response_model=EssayScoreResponse)
async def score_writing(
    body: EssayScoreRequest,
    settings: Settings = Depends(get_settings),
) -> EssayScoreResponse:
    """
    Chấm bài viết CAM_EDU (Gemini + RAG rubric + TTR anchor cho LR).

    **JSON:** chuỗi `essay_plaintext` phải là JSON hợp lệ — xuống dòng trong bài cần ghi `\\n`,
    không được dán nguyên newline thật trong chuỗi (Swagger/OpenAPI sẽ báo 422 `json_invalid`).
    Muốn dán bài nhiều đoạn trực tiếp, dùng `POST /api/v1/aes/score-form`.
    """
    return await score_essay(settings, body)


@router.post("/score-form", response_model=EssayScoreResponse)
async def score_writing_form(
    essay_plaintext: str = Form(..., description="Bài viết; cho phép nhiều dòng."),
    prompt_text: str = Form(...),
    task_type: int = Form(..., ge=1, le=2),
    cefr_level: str = Form(..., description="A1 | A2 | B1 | B2 | C1 | C2"),
    writing_score_history_json: str = Form(
        "[]",
        description='JSON array số, ví dụ `[6.0, 6.5]`',
    ),
    settings: Settings = Depends(get_settings),
) -> EssayScoreResponse:
    """Chấm điểm qua `multipart/form-data` — thuận tiện khi bài viết có nhiều xuống dòng (Swagger / Postman)."""
    try:
        raw = json.loads(writing_score_history_json)
        hist = [float(x) for x in raw] if isinstance(raw, list) else []
    except (json.JSONDecodeError, TypeError, ValueError):
        hist = []
    body = EssayScoreRequest(
        essay_plaintext=essay_plaintext,
        prompt_text=prompt_text,
        task_type=task_type,  # type: ignore[arg-type]
        cefr_level=cefr_level,  # type: ignore[arg-type]
        writing_score_history=hist,
    )
    return await score_essay(settings, body)

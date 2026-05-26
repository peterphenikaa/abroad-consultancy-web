"""E2E pipeline test (mock ASR — không cần Whisper model)."""

from __future__ import annotations

import io
import json
import struct
import wave
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import AsrSegment

MANIFEST = Path(__file__).resolve().parent / "fixtures" / "manifest.json"
AUDIO_DIR = Path(__file__).resolve().parent / "fixtures" / "audio"


def _make_wav_bytes(duration_s: float = 6.0, sample_rate: int = 16000) -> bytes:
    n = int(sample_rate * duration_s)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(struct.pack("<" + "h" * n, *([0] * n)))
    return buf.getvalue()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.mark.skipif(not MANIFEST.exists(), reason="missing manifest")
def test_score_endpoint_with_mock_asr(client: TestClient) -> None:
    cases = json.loads(MANIFEST.read_text(encoding="utf-8"))
    case = cases[0]

    wav_path = AUDIO_DIR / case["file"]
    if wav_path.exists():
        audio_bytes = wav_path.read_bytes()
    else:
        audio_bytes = _make_wav_bytes()

    hypothesis = case["reference_transcript"]
    mock_segments = [
        AsrSegment(text=w, start_s=float(i), end_s=float(i + 1))
        for i, w in enumerate(hypothesis.split())
    ]

    with patch(
        "app.services.scoring_pipeline.transcribe_audio",
        new=AsyncMock(return_value=(hypothesis, mock_segments)),
    ), patch(
        "app.services.scoring_pipeline.generate_feedback_vi",
        new=AsyncMock(return_value=("Phản hồi thử nghiệm.", None)),
    ):
        resp = client.post(
            "/api/v1/aps/score",
            files={"audio": (case["file"], audio_bytes, "audio/wav")},
            data={
                "reference_transcript": case["reference_transcript"],
                "cefr_level": case["cefr_level"],
                "target_accent": case.get("target_accent", "american"),
                "pronunciation_score_history_json": "[]",
            },
        )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert 0 <= body["band_overall"] <= 9
    assert body["hypothesis_transcript"] == hypothesis
    assert body["dimensions"]["wer"]["band"] >= 0
    assert body["scoring_source"] == "pipeline_v1"


def test_health(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}

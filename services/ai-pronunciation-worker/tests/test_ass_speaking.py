"""ASS endpoint — mock ASR + Gemini/heuristic."""

from __future__ import annotations

import io
import json
import struct
import wave
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import AsrSegment, SpeakingRubric
from app.services.gemini_speaking_rubric import GeminiSpeakingRubricResult


def _make_wav_bytes(duration_s: float = 6.0) -> bytes:
    sr = 16000
    n = int(sr * duration_s)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(struct.pack("<" + "h" * n, *([0] * n)))
    return buf.getvalue()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_ass_score_with_mock_gemini(client: TestClient) -> None:
    hypothesis = (
        "In my opinion, learning English helps me communicate with people worldwide."
    )
    segments = [
        AsrSegment(text=w, start_s=float(i), end_s=float(i + 1))
        for i, w in enumerate(hypothesis.split())
    ]
    mock_gem = GeminiSpeakingRubricResult(
        fluency_and_coherence=6.5,
        lexical_resource=6.0,
        grammatical_range_and_accuracy=5.5,
        pronunciation=7.0,
        improvement_suggestions=[],
    )

    with patch(
        "app.services.speaking_pipeline.transcribe_audio",
        new=AsyncMock(return_value=(hypothesis, segments)),
    ), patch(
        "app.services.speaking_pipeline.score_speaking_with_gemini",
        new=AsyncMock(return_value=(mock_gem, None)),
    ), patch(
        "app.services.speaking_pipeline.generate_feedback_vi",
        new=AsyncMock(return_value=("Phản hồi ASS.", None)),
    ):
        resp = client.post(
            "/api/v1/ass/score",
            files={"audio": ("test.wav", _make_wav_bytes(), "audio/wav")},
            data={
                "prompt_text": "What are the benefits of learning a foreign language?",
                "cefr_level": "B1",
                "target_accent": "american",
                "speaking_part": "1",
                "reference_transcript": "",
                "speaking_score_history_json": "[]",
            },
        )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["scoring_source"] == "pipeline_v1"
    assert 0 <= body["band_overall"] <= 9
    rubric = body["speaking_rubric"]
    assert rubric["fluency_and_coherence"] == 6.5
    assert rubric["pronunciation"] == 7.0
    assert body["pronunciation_dimensions"]["wer"]["band"] >= 0


def test_ass_heuristic_fallback(client: TestClient) -> None:
    hypothesis = "Hello, my name is Lin and I am learning English."
    segments = [
        AsrSegment(text=w, start_s=float(i), end_s=float(i + 1))
        for i, w in enumerate(hypothesis.split())
    ]

    with patch(
        "app.services.speaking_pipeline.transcribe_audio",
        new=AsyncMock(return_value=(hypothesis, segments)),
    ), patch(
        "app.services.speaking_pipeline.score_speaking_with_gemini",
        new=AsyncMock(return_value=(None, "Thiếu GOOGLE_AI_API_KEY")),
    ), patch(
        "app.services.speaking_pipeline.generate_feedback_vi",
        new=AsyncMock(return_value=(None, "skip")),
    ):
        resp = client.post(
            "/api/v1/ass/score",
            files={"audio": ("test.wav", _make_wav_bytes(), "audio/wav")},
            data={
                "prompt_text": "Introduce yourself.",
                "cefr_level": "A2",
                "reference_transcript": hypothesis,
                "speaking_part": "shadowing",
            },
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["scoring_source"] == "heuristic"
    assert body["speaking_rubric"]["fluency_and_coherence"] >= 4.0


def test_speaking_band_overall_rounding() -> None:
    from app.services.speaking_band_fusion import speaking_band_overall

    r = SpeakingRubric(
        fluency_and_coherence=6.0,
        lexical_resource=6.0,
        grammatical_range_and_accuracy=6.0,
        pronunciation=7.0,
    )
    assert speaking_band_overall(r) == 6.5

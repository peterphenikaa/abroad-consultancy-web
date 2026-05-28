#!/usr/bin/env python3
"""
E2E local: POST each manifest clip to ASS (IELTS Speaking) worker.

Usage:
  py -m uvicorn app.main:app --port 8089
  py scripts/generate_audio_fixtures.py
  py scripts/e2e_ass_local.py
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    reconfigure = getattr(_stream, "reconfigure", None)
    if callable(reconfigure):
        try:
            reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "tests" / "fixtures" / "manifest.json"
AUDIO_DIR = ROOT / "tests" / "fixtures" / "audio"
DEFAULT_BASE = "http://127.0.0.1:8089/api/v1/ass"

RUBRIC_KEYS = (
    "fluency_and_coherence",
    "lexical_resource",
    "grammatical_range_and_accuracy",
    "pronunciation",
)


def _score_url(base: str) -> str:
    base = base.rstrip("/")
    if base.endswith("/ass"):
        return f"{base}/score"
    return f"{base}/api/v1/ass/score"


def main() -> int:
    parser = argparse.ArgumentParser(description="ASS E2E local scorer")
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE,
        help="Worker base (default direct) hoặc gateway …/api/v1/ass",
    )
    parser.add_argument("--timeout", type=float, default=180.0)
    parser.add_argument("--skip-health", action="store_true")
    args = parser.parse_args()

    try:
        import httpx
    except ImportError:
        print("Cài httpx: py -m pip install httpx")
        return 1

    if not MANIFEST.exists():
        print(f"❌ Thiếu manifest: {MANIFEST}")
        return 1

    cases = json.loads(MANIFEST.read_text(encoding="utf-8"))
    score_url = _score_url(args.base_url)
    health_url = score_url.replace("/api/v1/ass/score", "/health").replace("/ass/score", "/health")
    if "/api/v1/ass" in args.base_url:
        health_url = args.base_url.rstrip("/").replace("/api/v1/ass", "") + "/health"

    client = httpx.Client(timeout=args.timeout)

    if not args.skip_health:
        try:
            h = client.get(health_url)
            h.raise_for_status()
            print(f"Health OK: {health_url}")
        except Exception as e:
            print(f"❌ Worker không sẵn sàng ({health_url}): {e}")
            print("   Chạy: py -m uvicorn app.main:app --port 8089")
            return 1

    passed = 0
    failed = 0
    rows: list[str] = []

    for case in cases:
        wav = AUDIO_DIR / case["file"]
        if not wav.exists():
            print(f"❌ Thiếu audio: {wav}")
            print("   Chạy: py scripts/generate_audio_fixtures.py")
            return 1

        t0 = time.perf_counter()
        with wav.open("rb") as f:
            files = {"audio": (case["file"], f, "audio/wav")}
            data = {
                "prompt_text": case.get(
                    "prompt_text",
                    "Please read the following sentence aloud clearly.",
                ),
                "reference_transcript": case["reference_transcript"],
                "cefr_level": case["cefr_level"],
                "target_accent": case.get("target_accent", "american"),
                "speaking_part": case.get("speaking_part", "shadowing"),
                "speaking_score_history_json": "[]",
            }
            try:
                resp = client.post(score_url, files=files, data=data)
            except Exception as e:
                failed += 1
                rows.append(f"FAIL {case['id']}: {e}")
                continue

        elapsed = time.perf_counter() - t0

        if resp.status_code != 200:
            failed += 1
            rows.append(f"FAIL {case['id']}: HTTP {resp.status_code} — {resp.text[:200]}")
            continue

        body = resp.json()
        band = body.get("band_overall")
        source = body.get("scoring_source")
        rubric = body.get("speaking_rubric") or {}
        hyp = (body.get("hypothesis_transcript") or "")[:50]

        if band is None or not isinstance(band, (int, float)):
            failed += 1
            rows.append(f"FAIL {case['id']}: thiếu band_overall")
            continue

        missing = [k for k in RUBRIC_KEYS if k not in rubric]
        if missing:
            failed += 1
            rows.append(f"FAIL {case['id']}: thiếu rubric keys {missing}")
            continue

        fc = rubric["fluency_and_coherence"]
        lr = rubric["lexical_resource"]
        gra = rubric["grammatical_range_and_accuracy"]
        p = rubric["pronunciation"]

        if not all(isinstance(x, (int, float)) and 0 <= x <= 9 for x in (fc, lr, gra, p)):
            failed += 1
            rows.append(f"FAIL {case['id']}: rubric ngoài khoảng 0–9")
            continue

        passed += 1
        rows.append(
            f"OK   {case['id']}: overall={band} FC={fc} LR={lr} GRA={gra} P={p} "
            f"source={source} time={elapsed:.1f}s hyp=\"{hyp}…\""
        )

    print("\n--- ASS E2E (IELTS Speaking) ---")
    for line in rows:
        print(line)
    print(f"\nTổng: {passed} passed, {failed} failed / {len(cases)}")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

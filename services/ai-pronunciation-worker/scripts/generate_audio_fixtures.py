#!/usr/bin/env python3
"""
Generate sample audio clips for E2E (edge-tts -> WAV >= 5s).

Usage (from ai-pronunciation-worker):
  py -m pip install edge-tts imageio-ffmpeg
  py scripts/generate_audio_fixtures.py
"""

from __future__ import annotations

import asyncio
import json
import sys
import tempfile
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    reconfigure = getattr(_stream, "reconfigure", None)
    if callable(reconfigure):
        try:
            reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

ROOT = Path(__file__).resolve().parents[1]
FIXTURES_DIR = ROOT / "tests" / "fixtures" / "audio"
MANIFEST = ROOT / "tests" / "fixtures" / "manifest.json"
MIN_DURATION_MS = 5500
VOICE_US = "en-US-JennyNeural"
VOICE_GB = "en-GB-SoniaNeural"


def _ffmpeg_exe() -> str:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return "ffmpeg"


async def _tts_to_wav(text: str, voice: str, out_wav: Path) -> None:
    import edge_tts
    import subprocess

    ffmpeg = _ffmpeg_exe()

    with tempfile.TemporaryDirectory() as tmp:
        mp3 = Path(tmp) / "clip.mp3"
        communicate = edge_tts.Communicate(text, voice=voice)
        await communicate.save(str(mp3))

        raw_wav = Path(tmp) / "raw.wav"
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-i",
                str(mp3),
                "-ar",
                "16000",
                "-ac",
                "1",
                str(raw_wav),
            ],
            check=True,
            capture_output=True,
        )

        probe = subprocess.run(
            [ffmpeg, "-i", str(raw_wav), "-f", "null", "-"],
            capture_output=True,
            text=True,
        )
        duration = 0.0
        for line in (probe.stderr or "").splitlines():
            if "Duration:" in line:
                part = line.split("Duration:", 1)[1].split(",")[0].strip()
                h, m, s = part.split(":")
                duration = int(h) * 3600 + int(m) * 60 + float(s)
                break

        min_s = MIN_DURATION_MS / 1000.0
        pad_s = max(0.0, min_s - duration)

        out_wav.parent.mkdir(parents=True, exist_ok=True)
        if pad_s > 0.01:
            subprocess.run(
                [
                    ffmpeg,
                    "-y",
                    "-i",
                    str(raw_wav),
                    "-af",
                    f"apad=pad_dur={pad_s:.3f}",
                    str(out_wav),
                ],
                check=True,
                capture_output=True,
            )
        else:
            out_wav.write_bytes(raw_wav.read_bytes())


async def main() -> int:
    if not MANIFEST.exists():
        print(f"❌ Không tìm thấy manifest: {MANIFEST}")
        return 1

    cases = json.loads(MANIFEST.read_text(encoding="utf-8"))
    print(f"Tạo {len(cases)} clip → {FIXTURES_DIR}")

    for case in cases:
        voice = VOICE_GB if case.get("target_accent") == "british" else VOICE_US
        out = FIXTURES_DIR / case["file"]
        print(f"  • {case['id']} ({voice}) …")
        await _tts_to_wav(case["reference_transcript"], voice, out)

    print("✅ Xong. Chạy E2E: py scripts/e2e_local.py")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

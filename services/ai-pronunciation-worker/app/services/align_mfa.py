"""Stage 2: Montreal Forced Aligner — placeholder (phase 2)."""

from __future__ import annotations

from pathlib import Path

from app.config import Settings


async def align_phonemes(
    settings: Settings,
    _wav_path: Path,
    _reference_transcript: str,
) -> list[tuple[str, str, float]] | None:
    """
    Returns list of (expected_phoneme, observed_phoneme, weight) or None if MFA disabled.

    Phase 2: spawn MFA CLI / use prebuilt acoustic model + dictionary.
    """
    if not settings.mfa_enabled:
        return None
    # TODO: integrate montreal-forced-aligner
    return None

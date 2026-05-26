from app.schemas import DimensionScore, PronunciationDimensions
from app.services.score_fusion import fuse_bands, round_ielts_band


def _dims(wer: float, flu: float, pro: float, comp: float) -> PronunciationDimensions:
    return PronunciationDimensions(
        wer=DimensionScore(value=0.1, band=wer),
        fluency=DimensionScore(value=120, band=flu),
        prosody=DimensionScore(value=0.7, band=pro),
        completeness=DimensionScore(value=0.9, band=comp),
        phoneme_accuracy=None,
    )


def test_round_ielts_half_step():
    assert round_ielts_band(6.7) == 6.5
    assert round_ielts_band(6.8) == 7.0
    assert round_ielts_band(6.25) == 6.5


def test_fuse_bands_in_range():
    band = fuse_bands(_dims(7.0, 7.0, 6.5, 8.0))
    assert 4.0 <= band <= 9.0

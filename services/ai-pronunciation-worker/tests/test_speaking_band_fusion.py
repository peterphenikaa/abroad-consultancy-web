from app.schemas import DimensionScore, PronunciationDimensions
from app.services.speaking_band_fusion import acoustic_pronunciation_band


def test_acoustic_pronunciation_band() -> None:
    dims = PronunciationDimensions(
        wer=DimensionScore(value=0.1, band=7.0),
        fluency=DimensionScore(value=120.0, band=6.5),
        prosody=DimensionScore(value=0.6, band=7.5),
        completeness=DimensionScore(value=0.9, band=8.0),
    )
    band = acoustic_pronunciation_band(dims)
    assert 6.0 <= band <= 8.0

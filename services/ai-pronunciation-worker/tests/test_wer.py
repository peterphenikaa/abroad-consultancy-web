from app.services.metrics_wer import compute_wer, normalize_text, wer_to_band


def test_normalize_text():
    assert normalize_text("Hello, World!") == "hello world"


def test_compute_wer_perfect():
    assert compute_wer("hello world", "hello world") == 0.0


def test_compute_wer_one_substitution():
    wer = compute_wer("hello world", "hello word")
    assert 0.0 < wer <= 0.5


def test_wer_to_band():
    assert wer_to_band(0.0) >= 8.0
    assert wer_to_band(0.5) <= 5.0

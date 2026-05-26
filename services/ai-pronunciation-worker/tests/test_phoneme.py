from app.services.metrics_phoneme import compute_phoneme_accuracy, load_vi_phoneme_weights


def test_phoneme_accuracy_all_match():
    exp = ["p", "t", "k"]
    obs = ["p", "t", "k"]
    w = {"p": 1.0, "t": 1.0, "k": 1.0}
    assert compute_phoneme_accuracy(exp, obs, w) == 1.0


def test_phoneme_accuracy_weighted_miss():
    exp = ["p", "t"]
    obs = ["p", "k"]
    w = {"p": 1.0, "t": 2.0}
    pa = compute_phoneme_accuracy(exp, obs, w)
    assert 0.0 < pa < 1.0


def test_load_default_weights():
    w = load_vi_phoneme_weights("data/nonexistent.json")
    assert "l" in w and w["l"] > 0

import spacy
from spacy.language import Language

_nlp: Language | None = None


def get_nlp() -> Language:
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError as e:
            raise RuntimeError(
                "Chưa có model spaCy en_core_web_sm. Cài: python -m spacy download en_core_web_sm"
            ) from e
    return _nlp


def _word_tokens_lower(text: str) -> list[str]:
    """Token từ (chữ) thống nhất cho TTR / MTLD — spaCy, lower, bỏ punct/space."""
    if not text.strip():
        return []
    nlp = get_nlp()
    doc = nlp(text.lower())
    return [t.text for t in doc if not t.is_punct and not t.is_space and t.text.strip()]


def calculate_ttr(text: str) -> float:
    """
    Type–Token Ratio (TTR) cho Lexical Resource: |unique tokens| / |total tokens|.
    """
    tokens = _word_tokens_lower(text)
    if not tokens:
        return 0.0
    return round(len(set(tokens)) / len(tokens), 4)


def _forward_mtld_factor_lengths(
    tokens: list[str],
    *,
    ttr_threshold: float = 0.72,
) -> list[float]:
    """
    McCarthy & Jarvis (2010) — forward pass: mỗi factor = độ dài đoạn liên tiếp
    cho tới khi TTR (trên đoạn) giảm dưới ngưỡng; từ gây giảm không tính vào factor
    mà mở đoạn mới từ đó. Đoạn cuối nếu không xuống dưới ngưỡng thì dùng partial factor
    (1−T)/(1−TTR)·L như tài liệu gốc.
    """
    n = len(tokens)
    if n == 0:
        return []

    factors: list[float] = []
    i = 0
    t = ttr_threshold

    while i < n:
        types: set[str] = set()
        broken = False
        for j in range(i, n):
            types.add(tokens[j])
            seg_len = j - i + 1
            ttr = len(types) / seg_len
            if ttr < t and seg_len > 1:
                fac = float(seg_len - 1)
                if fac > 0:
                    factors.append(fac)
                i = j
                broken = True
                break

        if broken:
            continue

        # Không gặp TTR < t trong vòng lặp: còn lại đoạn [i:n)
        seg_len = n - i
        if seg_len <= 0:
            break
        types = set(tokens[k] for k in range(i, n))
        ttr = len(types) / seg_len
        if ttr >= t:
            if ttr < 1.0 - 1e-12:
                partial = (1.0 - t) / (1.0 - ttr) * seg_len
            else:
                partial = float(seg_len)
            factors.append(partial)
        else:
            factors.append(float(seg_len))
        break

    return factors


def calculate_mtld(text: str, *, ttr_threshold: float = 0.72) -> float:
    """
    MTLD (Measure of Textual Lexical Diversity), forward.

    Với các factor độ dài L_i (đoạn cuối có thể là partial), giá trị báo cáo thông dụng
    là **trung bình độ dài factor** = (Σ_i L_i) / k — tương đương N/k khi các factor
    phân hoạch gần hết toàn bài (k = số factor). Khớp hướng đề cương: dùng TTR ngưỡng
    trên từng segment rồi tổng hợp.
    """
    tokens = _word_tokens_lower(text)
    if not tokens:
        return 0.0
    facs = _forward_mtld_factor_lengths(tokens, ttr_threshold=ttr_threshold)
    if not facs:
        return 0.0
    return round(sum(facs) / len(facs), 4)


if __name__ == "__main__":
    sample = "AI is great. AI is powerful. We love AI."
    print(f"Test TTR: {calculate_ttr(sample)}")
    print(f"Test MTLD: {calculate_mtld(sample)}")

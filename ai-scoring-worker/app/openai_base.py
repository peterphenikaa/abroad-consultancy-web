"""Chuẩn hóa OPENAI_BASE_URL — SDK httpx yêu cầu URL có scheme http(s)."""


def openai_base_url_or_none(url: str | None) -> str | None:
    if not url or not isinstance(url, str):
        return None
    u = url.strip().rstrip("/")
    if not u:
        return None
    if u.startswith(("http://", "https://")):
        return u
    return None

"""
Nạp cam_edu_rubric.json lên Pinecone bằng embedding Gemini API (mặc định models/gemini-embedding-001).

⚠️ Index Pinecone phải cùng dimension với vector: mặc định output_dimensionality=768 (xem app.config).
   Đặt GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY=0 để không cắt chiều (~3072) và tạo index tương ứng.

Yêu cầu .env: GOOGLE_AI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME.
Tuỳ chọn: GEMINI_EMBEDDING_MODEL, GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY, PINECONE_NAMESPACE.

Chạy: cd ai-scoring-worker && py scripts/seed_pinecone_rubric.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, overload

ROOT = Path(__file__).resolve().parents[1]


def _ensure_utf8_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except Exception:
                pass


def _chdir_root() -> None:
    os.chdir(ROOT)


def _load_dotenv() -> None:
    path = ROOT / ".env"
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        if not key or key in os.environ:
            continue
        val = val.strip()
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        os.environ[key] = val


@overload
def _env(name: str) -> str | None: ...


@overload
def _env(name: str, default: str) -> str: ...


def _env(name: str, default: str | None = None) -> str | None:
    v = os.environ.get(name)
    if v is not None and v.strip() != "":
        return v.strip()
    return default


def _slug(s: str, max_len: int = 48) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.strip()).strip("-").lower()
    return s[:max_len] or "x"


def _build_chunk_text(row: dict) -> str:
    band = row.get("band")
    cefr = row.get("cefr", "")
    crit = row.get("criterion", "")
    desc = row.get("description", "")
    return (
        "CAM_EDU Writing band descriptor\n"
        f"Band: {band}\n"
        f"CEFR anchor: {cefr}\n"
        f"Criterion: {crit}\n"
        f"Descriptor: {desc}"
    )


def _extract_embedding(resp: Any) -> list[float]:
    """google-generativeai: dict/object có .embedding; embedding có thể là list hoặc dict {\"values\": [...]}."""
    if isinstance(resp, dict):
        emb = resp.get("embedding")
    else:
        emb = getattr(resp, "embedding", None)
    if isinstance(emb, dict) and "values" in emb:
        emb = emb["values"]
    if not emb:
        raise ValueError("Phản hồi embed không có trường embedding")
    return [float(x) for x in emb]


def _ensure_pkg_root_on_path() -> None:
    root_s = str(ROOT)
    if root_s not in sys.path:
        sys.path.insert(0, root_s)


def main() -> int:
    _ensure_utf8_stdio()
    parser = argparse.ArgumentParser(description="Embed rubric JSON (Gemini) và upsert Pinecone.")
    parser.add_argument(
        "--json-path",
        type=Path,
        default=ROOT / "data" / "cam_edu_rubric.json",
        help="Đường dẫn tới JSON.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Chỉ in chunk + không gọi API.",
    )
    parser.add_argument(
        "--delay-s",
        type=float,
        default=0.12,
        help="Nghỉ giữa các lần gọi embed (tránh rate limit), mặc định 0.12s.",
    )
    args = parser.parse_args()

    _chdir_root()
    _load_dotenv()
    _ensure_pkg_root_on_path()

    path = args.json_path if args.json_path.is_absolute() else ROOT / args.json_path
    if not path.exists():
        print(f"Không tìm thấy file: {path}", file=sys.stderr)
        return 1

    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        print("JSON phải là một mảng.", file=sys.stderr)
        return 1
    rows: list[dict] = [item for item in raw if isinstance(item, dict)]

    ids: list[str] = []
    texts: list[str] = []
    metas: list[dict] = []

    for i, row in enumerate(rows):
        band = row.get("band")
        cefr = str(row.get("cefr", ""))
        crit = str(row.get("criterion", ""))
        chunk = _build_chunk_text(row)
        rid = f"cam-edu-rubric-{_slug(str(band))}-{_slug(crit)}-{i}"
        ids.append(rid)
        texts.append(chunk)
        metas.append(
            {
                "text": chunk,
                "band": float(band) if isinstance(band, (int, float)) else band,
                "cefr": cefr,
                "criterion": crit,
                "source": "cam_edu_rubric.json",
            }
        )

    if args.dry_run:
        print(f"Dry-run: {len(texts)} vectors sẽ được upsert (Gemini embed / chunk).")
        if texts:
            print("--- mẫu ---\n", texts[0][:800], sep="")
        return 0

    try:
        from app.config import get_settings

        settings = get_settings()
        google_key = settings.google_ai_api_key
        pine_key = settings.pinecone_api_key
        pine_index = settings.pinecone_index_name
        embed_model = (settings.gemini_embedding_model or "").strip() or "models/gemini-embedding-001"
        output_dim_raw = settings.gemini_embedding_output_dimensionality
        namespace = settings.pinecone_namespace
    except Exception:
        google_key = _env("GOOGLE_AI_API_KEY")
        pine_key = _env("PINECONE_API_KEY")
        pine_index = _env("PINECONE_INDEX_NAME")
        embed_model = (_env("GEMINI_EMBEDDING_MODEL") or "").strip() or "models/gemini-embedding-001"
        output_dim_raw = 768
        od_env = _env("GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY")
        if od_env is not None:
            try:
                output_dim_raw = int(od_env.strip())
            except ValueError:
                pass
        namespace = _env("PINECONE_NAMESPACE")

    output_dim = output_dim_raw if output_dim_raw > 0 else None

    if not google_key:
        print("Thiếu GOOGLE_AI_API_KEY trong .env (hoặc google_ai_api_key)", file=sys.stderr)
        return 1
    if not pine_key or not pine_index:
        print("Thiếu PINECONE_API_KEY hoặc PINECONE_INDEX_NAME trong .env", file=sys.stderr)
        return 1

    try:
        import google.generativeai as genai
        from pinecone import Pinecone
    except ModuleNotFoundError:
        print("Thiếu package: pip install google-generativeai pinecone", file=sys.stderr)
        return 1

    genai.configure(api_key=google_key)  # type: ignore[attr-defined]

    dim_hint = f"{output_dim_raw}" if output_dim is not None else "full (API default)"
    print(
        f"Đang embed {len(texts)} chunk bằng Gemini ({embed_model}), "
        f"task RETRIEVAL_DOCUMENT, output_dimensionality={dim_hint}…"
    )
    embeddings: list[list[float]] = []
    dim: int | None = None
    for idx, text in enumerate(texts):
        try:
            embed_kwargs: dict[str, Any] = {
                "model": embed_model,
                "content": text,
                "task_type": "retrieval_document",
            }
            if output_dim is not None:
                embed_kwargs["output_dimensionality"] = output_dim
            resp = genai.embed_content(**embed_kwargs)  # type: ignore[attr-defined]
            vec = _extract_embedding(resp)
        except Exception as e:
            print(f"Lỗi embed chunk {idx}: {e}", file=sys.stderr)
            return 1
        if dim is None:
            dim = len(vec)
            print(f"  → Vector dimension: {dim} (index Pinecone phải khớp)")
        elif len(vec) != dim:
            print(f"Lỗi: chunk {idx} có dimension {len(vec)}, mong đợi {dim}", file=sys.stderr)
            return 1
        embeddings.append(vec)
        if idx + 1 < len(texts) and args.delay_s > 0:
            time.sleep(args.delay_s)

    pc = Pinecone(api_key=pine_key)
    index = pc.Index(pine_index)

    upsert_payload = [
        {"id": ids[i], "values": embeddings[i], "metadata": metas[i]} for i in range(len(ids))
    ]

    print("Đang upsert Pinecone…")
    if namespace:
        index.upsert(vectors=upsert_payload, namespace=namespace)
    else:
        index.upsert(vectors=upsert_payload)

    print(f"Xong: {len(upsert_payload)} vector → index={pine_index!r}, dim={dim}, ns={namespace!r}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

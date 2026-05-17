import asyncio
import logging
from typing import TYPE_CHECKING, Any

import httpx

from app.config import Settings
from app.openai_base import openai_base_url_or_none
from app.schemas import DescriptorChunk, EssayScoreRequest

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


def _build_rag_query(payload: EssayScoreRequest) -> str:
    parts = [
        f"CEFR: {payload.cefr_level}",
        f"Task: {payload.task_type}",
        "Prompt:",
        payload.prompt_text.strip(),
        "Essay excerpt:",
        payload.essay_plaintext.strip()[:2000],
    ]
    return "\n".join(parts)


def _gemini_embedding_from_response(resp: Any) -> list[float]:
    if isinstance(resp, dict):
        emb = resp.get("embedding")
    else:
        emb = getattr(resp, "embedding", None)
    if isinstance(emb, dict) and "values" in emb:
        emb = emb["values"]
    if not emb:
        raise ValueError("Gemini embed response missing embedding")
    return [float(x) for x in emb]


def _sync_gemini_embed_query(
    api_key: str,
    model: str,
    text: str,
    *,
    task_type: str,
    output_dimensionality: int | None,
) -> list[float]:
    import google.generativeai as genai

    genai.configure(api_key=api_key)  # type: ignore[attr-defined]
    kwargs: dict[str, Any] = {
        "model": model,
        "content": text,
        "task_type": task_type,
    }
    if output_dimensionality is not None and output_dimensionality > 0:
        kwargs["output_dimensionality"] = output_dimensionality
    resp = genai.embed_content(**kwargs)  # type: ignore[attr-defined]
    return _gemini_embedding_from_response(resp)


async def retrieve_cam_descriptors(
    settings: Settings,
    payload: EssayScoreRequest,
    top_k: int = 8,
) -> list[DescriptorChunk]:
    """
    3-stage RAG:
    1) AES_RAG_SERVICE_URL: POST gateway RAG.
    2) Pinecone + embedding: OpenAI nếu có OPENAI_API_KEY; không thì Gemini nếu có GOOGLE_AI_API_KEY.
    3) Ngược lại: [].
    """
    query = _build_rag_query(payload)

    if settings.aes_rag_service_url:
        url = settings.aes_rag_service_url.rstrip("/") + "/cam-descriptors/retrieve"
        body = {
            "query": query,
            "cefr_level": payload.cefr_level,
            "task_type": payload.task_type,
            "top_k": top_k,
        }
        try:
            async with httpx.AsyncClient(
                timeout=settings.aes_rag_service_timeout_s
            ) as client:
                r = await client.post(url, json=body)
                r.raise_for_status()
                data = r.json()
        except Exception as e:
            logger.warning("RAG HTTP failed: %s", e)
            return []
        chunks: list[DescriptorChunk] = []
        for item in data.get("chunks", data if isinstance(data, list) else []):
            if isinstance(item, str):
                chunks.append(DescriptorChunk(text=item, score=None))
            elif isinstance(item, dict):
                chunks.append(
                    DescriptorChunk(
                        id=item.get("id"),
                        text=item.get("text", ""),
                        score=item.get("score"),
                    )
                )
        return [c for c in chunks if c.text]

    if settings.pinecone_api_key and settings.pinecone_index_name:
        if settings.openai_api_key:
            return await _pinecone_retrieve_openai(settings, query, top_k)
        if settings.google_ai_api_key:
            return await _pinecone_retrieve_gemini(settings, query, top_k)

    logger.info("RAG skipped: no service URL nor Pinecone+OpenAI/Gemini keys.")
    return []


async def _pinecone_retrieve_openai(
    settings: Settings,
    query: str,
    top_k: int,
) -> list[DescriptorChunk]:
    from openai import AsyncOpenAI
    from pinecone import Pinecone

    api_key = settings.openai_api_key
    if not api_key:
        return []
    base = openai_base_url_or_none(settings.openai_base_url)
    if base:
        client = AsyncOpenAI(api_key=api_key, base_url=base)
    else:
        client = AsyncOpenAI(api_key=api_key)
    emb = await client.embeddings.create(
        model=settings.openai_embedding_model,
        input=query,
    )
    vector = emb.data[0].embedding

    return _pinecone_query_vectors(settings, vector, top_k)


async def _pinecone_retrieve_gemini(
    settings: Settings,
    query: str,
    top_k: int,
) -> list[DescriptorChunk]:
    from pinecone import Pinecone

    key = settings.google_ai_api_key
    if not key:
        return []
    model = settings.gemini_embedding_model
    od = settings.gemini_embedding_output_dimensionality
    out_dim = od if od > 0 else None
    try:
        vector = await asyncio.to_thread(
            _sync_gemini_embed_query,
            key,
            model,
            query,
            task_type="retrieval_query",
            output_dimensionality=out_dim,
        )
    except Exception as e:
        logger.warning("Gemini embed (query) failed: %s", e)
        return []

    return _pinecone_query_vectors(settings, vector, top_k)


def _pinecone_query_vectors(
    settings: Settings,
    vector: list[float],
    top_k: int,
) -> list[DescriptorChunk]:
    from pinecone import Pinecone

    index_name = settings.pinecone_index_name
    if not index_name or not settings.pinecone_api_key:
        return []

    pc = Pinecone(api_key=settings.pinecone_api_key)
    index = pc.Index(index_name)
    query_kwargs: dict[str, Any] = {
        "vector": vector,
        "top_k": top_k,
        "include_metadata": True,
    }
    if settings.pinecone_namespace:
        query_kwargs["namespace"] = settings.pinecone_namespace

    try:
        res = index.query(**query_kwargs)
    except Exception as e:
        logger.warning("Pinecone query failed: %s", e)
        return []

    out: list[DescriptorChunk] = []
    for m in getattr(res, "matches", []) or []:
        meta = getattr(m, "metadata", None) or {}
        text = meta.get("text") or meta.get("content") or meta.get("chunk") or ""
        if not text and isinstance(meta, dict):
            text = str(meta)
        sid = getattr(m, "id", None)
        score = float(m.score) if getattr(m, "score", None) is not None else None
        if text:
            out.append(DescriptorChunk(id=sid, text=str(text)[:8000], score=score))
    return out

from __future__ import annotations

import logging
from typing import Any

import psycopg
from opensearchpy import OpenSearch

from app.config import Settings

logger = logging.getLogger(__name__)

_UNIVERSITIES_SQL = "SELECT * FROM crawler.raw_university_data"
_VISAS_SQL = "SELECT * FROM crawler.raw_visa_data"


def _row_to_university_doc(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "university",
        "title": row.get("universityname") or row.get("universityName"),
        "location": row.get("location"),
        "content": row.get("description"),
        "url": row.get("sourceurl") or row.get("sourceUrl"),
        "countryId": row.get("countryid") or row.get("countryId"),
    }


def _row_to_visa_doc(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "visa",
        "title": row.get("title"),
        "location": None,
        "content": row.get("rawtextcontent") or row.get("rawTextContent"),
        "url": row.get("sourceurl") or row.get("sourceUrl"),
        "countryId": row.get("countryid") or row.get("countryId"),
    }


def _fetch_rows(conn: psycopg.Connection, sql: str) -> list[dict[str, Any]]:
    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def sync_postgres_to_opensearch(settings: Settings, client: OpenSearch) -> int:
    """Đồng bộ crawler DB → OpenSearch index. Trả về số document đã index."""
    index_name = settings.search_index

    with psycopg.connect(settings.crawler_database_url) as conn:
        universities = _fetch_rows(conn, _UNIVERSITIES_SQL)
        visas = _fetch_rows(conn, _VISAS_SQL)

    if not universities and not visas:
        return 0

    if not client.indices.exists(index=index_name):
        client.indices.create(index=index_name)

    operations: list[dict[str, Any]] = []

    for uni in universities:
        uid = uni.get("id")
        operations.append({"index": {"_index": index_name, "_id": f"uni_{uid}"}})
        operations.append(_row_to_university_doc(uni))

    for visa in visas:
        vid = visa.get("id")
        operations.append({"index": {"_index": index_name, "_id": f"visa_{vid}"}})
        operations.append(_row_to_visa_doc(visa))

    response = client.bulk(body=operations, refresh=True)
    if response.get("errors"):
        logger.error("Bulk insert errors: %s", response)
        raise RuntimeError("Bulk insert có lỗi — xem log search-service")

    total = len(universities) + len(visas)
    logger.info(
        "Synced %d universities + %d visas → index %s",
        len(universities),
        len(visas),
        index_name,
    )
    return total

"""Part 14.4 — unified search returns results from multiple record types."""

from __future__ import annotations


def test_unified_search_multiple_types(client):
    # Seed across different record types via the simplified endpoints.
    client.post("/daily-input/ingest", params={"auto_classify": "true"},
                json={"log_date": "2026-06-16", "author": "대표",
                      "raw_text": "와디즈 캠페인 준비 미팅"})
    client.post("/rnd/experiments",
                json={"title": "히트프레스 실험", "subdomain": "히트프레스",
                      "summary": "히트프레스 조건 비교"})
    client.post("/rnd/samples",
                json={"sample_code": "SMP-001", "notes": "외관검사 양호"})

    res = client.get("/search/", params={"q": "", "filter": "전체"}).json()
    types = {r["type"] for r in res["results"]}
    # Results span more than one record type.
    assert len(types) >= 2
    assert res["count"] >= 3


def test_search_filter_rnd(client):
    client.post("/rnd/experiments",
                json={"title": "염색 테스트", "subdomain": "염색", "summary": "염색 결과"})
    res = client.get("/search/", params={"q": "염색", "filter": "R&D"}).json()
    assert res["count"] >= 1
    assert all(r["type"] == "R&D" for r in res["results"])

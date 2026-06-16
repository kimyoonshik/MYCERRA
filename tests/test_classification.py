"""Part 14.3 — today input classification endpoint works (+ not weakened)."""

from __future__ import annotations


def test_classify_funding(client):
    r = client.post("/daily-input/classify",
                    json={"raw_text": "와디즈 리워드 구성하고 상세페이지 작성"})
    assert r.status_code == 200
    assert r.json()["category"] == "클라우드펀딩"


def test_sensitive_rnd_defaults_restricted(client):
    r = client.post("/daily-input/classify",
                    json={"raw_text": "균주 배양 조건과 배합비 실험 진행"})
    body = r.json()
    assert body["category"] == "R&D"
    assert body["confidentiality"] == "restricted"
    assert body["sensitive"] is True
    assert body["create_policy_flag"] is True


def test_cannot_weaken_sensitive_to_public(client):
    # Requesting public on sensitive content must be tightened, not honored.
    r = client.post("/daily-input/classify",
                    json={"raw_text": "가소 SOP 절차 정리", "confidentiality": "public"})
    assert r.json()["confidentiality"] == "restricted"


def test_ingest_creates_records_and_flag(client):
    r = client.post("/daily-input/ingest",
                    params={"auto_classify": "true"},
                    json={"log_date": "2026-06-16", "author": "대표",
                          "raw_text": "생산원가 표 정리 및 실험 기록"})
    created = r.json()["created_records"]
    assert "daily_execution_logs" in created
    assert "next_actions" in created
    assert "policy_flags" in created  # sensitive term 생산원가 -> flag

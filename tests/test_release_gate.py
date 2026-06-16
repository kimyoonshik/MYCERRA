"""Part 14.5 / 14.11 — release review uses QA/legal/human gate; not weakened."""

from __future__ import annotations


def _make_output(client, body="지속가능 소재 캠페인 카피", conf="public"):
    return client.post("/review/outputs",
                       json={"title": "와디즈 카피", "body": body,
                             "purpose": "외부 캠페인", "confidentiality": conf}).json()


def test_full_gate_order_required(client):
    o = _make_output(client)
    oid = o["id"]

    # Cannot release before any gate.
    assert client.post(f"/review/outputs/{oid}/release").status_code == 403
    # Cannot do legal before QA.
    assert client.post(f"/review/outputs/{oid}/legal",
                       params={"passed": "true"}).status_code == 400
    # Cannot approve before QA+legal.
    assert client.post(f"/review/outputs/{oid}/approve",
                       params={"approved": "true"}).status_code == 400

    # Proper order: QA -> legal -> approve -> release.
    client.post(f"/review/outputs/{oid}/qa", params={"passed": "true"})
    client.post(f"/review/outputs/{oid}/legal", params={"passed": "true"})
    appr = client.post(f"/review/outputs/{oid}/approve",
                       params={"approved": "true"}).json()
    assert appr["allowed"] is True
    rel = client.post(f"/review/outputs/{oid}/release")
    assert rel.status_code == 200
    assert rel.json()["export_path"].endswith(".txt")  # local export only


def test_sensitive_output_blocked_from_public(client):
    # Sensitive content requested as public must be blocked, never released.
    o = _make_output(client, body="배합비와 균주 배양 조건 상세", conf="public")
    oid = o["id"]
    assert o["status"] == "blocked"
    gate = client.get(f"/review/outputs/{oid}/gate").json()
    assert gate["allowed"] is False
    assert client.post(f"/review/outputs/{oid}/release").status_code == 403


def test_queue_buckets_present(client):
    q = client.get("/review/queue").json()
    for bucket in ["검수 대기", "법무/IP/표현 검토 필요", "대표 승인 필요",
                   "외부공개 가능", "차단된 산출물"]:
        assert bucket in q
    assert "금지" in q["phrase_library"]

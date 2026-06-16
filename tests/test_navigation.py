"""Part 14.1 / 14.2 — simplified Korean navigation + advanced preserved."""

from __future__ import annotations


def test_main_menu_has_korean_labels(client):
    nav = client.get("/meta/navigation").json()
    assert nav["default_menu"] == "today"  # default opens 오늘
    ko_labels = [m["ko"] for m in nav["main_menus"]]
    for expected in ["오늘", "오늘 입력", "R&D / 샘플",
                     "사업 / 펀딩 / 투자", "검수 / 외부공개",
                     "찾기 / 자료보관", "고급 메뉴"]:
        assert expected in ko_labels


def test_advanced_menus_remain_accessible(client):
    data = client.get("/advanced/menus").json()
    ko = [m["ko"] for m in data["advanced_menus"]]
    en = [m["en"] for m in data["advanced_menus"]]
    # Detailed workbenches are moved, not deleted.
    assert "Agent Runs" in en
    assert "Backup & Restore" in en
    assert "System Health" in en
    assert "백업 / 복구" in ko


def test_agent_consolidation_groups(client):
    groups = client.get("/meta/agent-groups").json()
    assert set(groups["visible_groups"]) == {"마스터", "R&D", "사업", "검수", "찾기"}
    # Detailed agents still mapped underneath.
    assert "MASTER Agent" in groups["mapping"]["마스터"]
    assert "QA Agent" in groups["mapping"]["검수"]

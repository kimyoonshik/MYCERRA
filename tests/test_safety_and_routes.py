"""Part 14.6 / 14.8 / 14.9 / 14.10 — routes preserved, no external behavior."""

from __future__ import annotations

import pkgutil

import backend.app.models as models


# 14.6 — no existing backend routes/models removed.
EXPECTED_ROUTES = [
    "/meta/navigation", "/meta/labels", "/meta/agent-groups",
    "/today/", "/daily-input/classify", "/daily-input/ingest",
    "/rnd/sections", "/rnd/experiments", "/rnd/samples",
    "/business/tabs", "/business/crm", "/business/campaigns",
    "/review/queue", "/review/outputs", "/search/", "/search/filters",
    "/advanced/menus", "/advanced/health", "/advanced/backup",
]

EXPECTED_TABLES = [
    "daily_execution_logs", "rd_experiment_logs", "sample_status_records",
    "meeting_interaction_logs", "crm_organizations", "crm_interactions",
    "crowdfunding_campaigns", "crowdfunding_tasks", "next_actions",
    "policy_flags", "decision_risk_logs", "documents", "document_chunks",
    "outputs", "briefings", "qa_reviews", "legal_ip_records", "approvals",
    "market_signals", "release_packages",
]


def test_all_routes_present(client):
    paths = set()

    def collect(routes):
        for r in routes:
            p = getattr(r, "path", None)
            if p:
                paths.add(p)
            sub = getattr(r, "routes", None)
            if sub:
                collect(sub)
            # Some FastAPI versions wrap included routers lazily.
            orig = getattr(r, "original_router", None)
            if orig is not None:
                collect(getattr(orig, "routes", []))

    collect(client.app_ref.routes)
    for route in EXPECTED_ROUTES:
        assert route in paths, f"missing route {route}"


def test_all_models_present(client):
    tables = set(models.Base.metadata.tables.keys())
    for t in EXPECTED_TABLES:
        assert t in tables, f"missing table {t}"


def test_no_external_send_search_or_publish(client):
    """14.8/14.9/14.10 — no email/web-search/calendar/publish anywhere in code."""
    import backend.app as app_pkg

    banned = ["smtplib", "requests.get(\"http", "googleapis",
              "webbrowser", "publish_to", "send_email", "WebSearch"]
    for mod in pkgutil.walk_packages(app_pkg.__path__, "backend.app."):
        path = mod.module_finder.path + "/" + mod.name.split(".")[-1] + ".py"
        try:
            with open(path, encoding="utf-8") as fh:
                src = fh.read()
        except OSError:
            continue
        for term in banned:
            assert term not in src, f"banned external op {term} in {path}"


def test_health_reports_no_external(client):
    h = client.get("/advanced/health").json()
    assert h["외부연결"].startswith("없음")

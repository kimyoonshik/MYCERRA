"""MYCERRA Harness Agent OS — FastAPI application (Phase 14A).

Simplified Korean-first operator API. All processing is local: there is no
external sending, email, web search, calendar, or public publishing anywhere
in this service, and it is not exposed publicly by default.
"""

from __future__ import annotations

from fastapi import FastAPI

from .database import init_db
from .routers import (
    advanced,
    business,
    daily_input,
    meta,
    review,
    rnd,
    search,
    today,
)

app = FastAPI(
    title="MYCERRA Harness Agent OS",
    description="Phase 14A — Korean-first 운영 환경 (로컬 전용)",
    version="14A",
)


@app.on_event("startup")
def _startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok", "외부연결": "없음"}


for r in (meta, today, daily_input, rnd, business, review, search, advanced):
    app.include_router(r.router)

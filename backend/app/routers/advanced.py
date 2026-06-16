"""고급 메뉴 / Advanced — preserved detailed access (Parts 2, 13).

Exposes system health, backup/restore, agent runs, and raw record listing.
These are the original full menus, kept secondary but fully accessible.
"""

from __future__ import annotations

import datetime as _dt
import os
import shutil

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import constants, models
from ..agents import run_group
from ..database import DB_URL, get_db

router = APIRouter(prefix="/advanced", tags=["advanced"])


@router.get("/menus")
def menus():
    return {"advanced_menus": constants.ADVANCED_MENUS}


@router.get("/health")
def health(db: Session = Depends(get_db)):
    counts = {}
    for model in models.SEARCHABLE_MODELS:
        counts[model.__tablename__] = db.query(model).count()
    return {"status": "ok", "db_url": DB_URL, "record_counts": counts,
            "외부연결": "없음 (외부 전송/검색/공개 비활성)"}


class AgentRunRequest(BaseModel):
    group: str
    instruction: str


@router.post("/agent-run")
def agent_run(req: AgentRunRequest):
    """Raw agent run via the consolidated group layer (still offline)."""
    return run_group(req.group, req.instruction)


@router.post("/backup")
def backup():
    """백업 실행 — local copy of the SQLite file only."""
    if not DB_URL.startswith("sqlite"):
        return {"ok": False, "reason": "SQLite 백업만 지원합니다."}
    src = DB_URL.replace("sqlite:///", "")
    if not os.path.exists(src):
        return {"ok": False, "reason": constants.MESSAGES["no_records"]}
    os.makedirs("backups", exist_ok=True)
    stamp = _dt.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    dst = os.path.join("backups", f"mycerra_{stamp}.db")
    shutil.copyfile(src, dst)
    return {"ok": True, "backup_path": dst}

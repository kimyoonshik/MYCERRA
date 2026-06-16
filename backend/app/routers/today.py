"""오늘 / HOME — Daily Command (Part 4)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import constants, models
from ..database import get_db

router = APIRouter(prefix="/today", tags=["today"])


@router.get("/")
def home(db: Session = Depends(get_db)):
    # 1. 오늘의 마스터 브리핑
    briefing = db.query(models.Briefing).order_by(models.Briefing.id.desc()).first()
    briefing_text = briefing.summary if briefing else constants.MESSAGES["no_briefing_today"]

    # 2. 오늘 해야 할 일 Top 3
    top3 = (db.query(models.NextAction)
            .filter(models.NextAction.done == False)  # noqa: E712
            .order_by(models.NextAction.priority.asc(), models.NextAction.id.desc())
            .limit(3).all())

    # 3. 긴급 경고 — critical flags, blocked outputs, overdue tasks
    critical_flags = (db.query(models.PolicyFlag)
                      .filter(models.PolicyFlag.severity == "critical",
                              models.PolicyFlag.resolved == False)  # noqa: E712
                      .all())
    blocked = (db.query(models.Output)
               .filter(models.Output.status == "blocked").all())
    overdue = (db.query(models.NextAction)
               .filter(models.NextAction.overdue == True,  # noqa: E712
                       models.NextAction.done == False).all())  # noqa: E712

    # 4. 검수 대기 — QA / Legal / Human approval pending
    qa_pending = db.query(models.Output).filter(models.Output.status == "pending_qa").all()
    legal_pending = db.query(models.Output).filter(
        models.Output.status == "legal_review_needed").all()
    approval_pending = db.query(models.Output).filter(
        models.Output.status == "human_approval_needed").all()

    # 5. 최근 결과물
    recent = (db.query(models.Output)
              .order_by(models.Output.id.desc()).limit(5).all())

    return {
        "title": {"ko": "오늘", "en": "MYCERRA Daily Command"},
        "master_briefing": briefing_text,
        "top3": [{"id": a.id, "title": a.title, "priority": a.priority} for a in top3],
        "urgent": {
            "critical_flags": [{"id": f.id, "reason": f.reason} for f in critical_flags],
            "blocked_outputs": [{"id": o.id, "title": o.title} for o in blocked],
            "overdue_tasks": [{"id": t.id, "title": t.title} for t in overdue],
        },
        "pending_reviews": {
            "qa": [{"id": o.id, "title": o.title} for o in qa_pending],
            "legal": [{"id": o.id, "title": o.title} for o in legal_pending],
            "human_approval": [{"id": o.id, "title": o.title} for o in approval_pending],
        },
        "recent_outputs": [
            {"id": o.id, "title": o.title,
             "status_ko": constants.status_ko(o.status),
             "confidentiality_ko": constants.confidentiality_ko(o.confidentiality)}
            for o in recent
        ],
        "quick_actions": [
            "오늘 일 입력하기", "마스터 브리핑 생성", "자동운영 실행",
            "자료 검색", "백업 실행",
        ],
        "guided_cards": [
            "오늘 있었던 일 입력", "샘플 결과 분석", "와디즈 준비 점검",
            "투자자 미팅 준비", "외부로 보낼 문구 검수", "예전 자료 찾기",
        ],
    }


@router.post("/briefing/generate")
def generate_briefing(brief_date: str, db: Session = Depends(get_db)):
    """마스터 브리핑 생성 — summarizes today's logs locally (no network)."""
    logs = db.query(models.DailyExecutionLog).filter(
        models.DailyExecutionLog.log_date == brief_date).all()
    if not logs:
        summary = constants.MESSAGES["no_briefing_today"]
    else:
        cats: dict[str, int] = {}
        for log in logs:
            cats[log.category] = cats.get(log.category, 0) + 1
        parts = [f"{k} {v}건" for k, v in cats.items()]
        summary = f"{brief_date} 마스터 브리핑: 총 {len(logs)}건 입력 ({', '.join(parts)})."
    b = models.Briefing(brief_date=brief_date, summary=summary)
    db.add(b); db.commit(); db.refresh(b)
    return {"id": b.id, "summary": b.summary}

"""오늘 입력 / Daily Input unified flow (Part 5)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import classification, models, schemas
from ..database import get_db

router = APIRouter(prefix="/daily-input", tags=["daily-input"])


@router.post("/classify", response_model=schemas.ClassifyResponse)
def classify(req: schemas.ClassifyRequest):
    """AI가 자동 분류하기 — shows 자동 분류 결과 before final save."""
    result = classification.classify(req.raw_text, req.confidentiality)
    return schemas.ClassifyResponse(
        category=result.category,
        confidence=result.confidence,
        confidentiality=result.confidentiality,
        sensitive=result.sensitive,
        matched_terms=result.matched_terms,
        proposed_records=result.proposed_records,
        create_policy_flag=result.create_policy_flag,
    )


@router.post("/ingest")
def ingest(req: schemas.DailyInputCreate, auto_classify: bool = True,
           db: Session = Depends(get_db)):
    """Operator enters text once; system creates the relevant records.

    Always writes a daily_execution_log. When auto_classify is on, it also
    creates category-specific records, a next_action, and a policy_flag if
    sensitive terms appear. Sensitive R&D defaults to Restricted.
    """
    result = classification.classify(req.raw_text, req.confidentiality)
    grade = result.confidentiality
    created: dict[str, list[int]] = {}

    log = models.DailyExecutionLog(
        log_date=req.log_date,
        author=req.author,
        raw_text=req.raw_text,
        importance=req.importance,
        confidentiality=grade,
        category=result.category,
        related_sample=req.related_sample,
    )
    db.add(log)
    db.flush()
    created["daily_execution_logs"] = [log.id]

    if auto_classify:
        if result.category == "R&D":
            rd = models.RDExperimentLog(
                title=req.raw_text[:60], summary=req.raw_text,
                confidentiality=grade, source_log_id=log.id)
            db.add(rd); db.flush()
            created["rd_experiment_logs"] = [rd.id]
        if result.category == "샘플/QC":
            s = models.SampleStatusRecord(
                sample_code=(req.related_sample or "미지정"),
                notes=req.raw_text, confidentiality=grade)
            db.add(s); db.flush()
            created["sample_status_records"] = [s.id]
        if result.category == "투자자/파트너":
            m = models.MeetingInteractionLog(
                counterpart="미지정", summary=req.raw_text, confidentiality=grade)
            db.add(m); db.flush()
            created["meeting_interaction_logs"] = [m.id]
        if result.category == "클라우드펀딩":
            t = models.CrowdfundingTask(title=req.raw_text[:60])
            db.add(t); db.flush()
            created["crowdfunding_tasks"] = [t.id]
        if result.category == "법무/검수":
            d = models.DecisionRiskLog(
                title=req.raw_text[:60], detail=req.raw_text,
                kind="risk", confidentiality=grade)
            db.add(d); db.flush()
            created["decision_risk_logs"] = [d.id]

        na = models.NextAction(
            title=f"[{result.category}] 후속 조치: {req.raw_text[:40]}",
            source="MASTER", source_log_id=log.id)
        db.add(na); db.flush()
        created["next_actions"] = [na.id]

        if result.create_policy_flag:
            pf = models.PolicyFlag(
                severity="critical",
                reason="제한기밀 주제 감지 — 외부공개 차단 필요",
                matched_terms=", ".join(result.matched_terms),
                record_type="daily_execution_logs", record_id=log.id)
            db.add(pf); db.flush()
            created["policy_flags"] = [pf.id]

    db.commit()
    return {
        "classification": {
            "category": result.category,
            "confidentiality": grade,
            "sensitive": result.sensitive,
            "confidence": result.confidence,
        },
        "created_records": created,
    }

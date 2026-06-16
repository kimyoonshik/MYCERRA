"""R&D / 샘플 simplified page (Part 6)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import constants, models
from ..database import get_db
from ..safety import default_confidentiality

router = APIRouter(prefix="/rnd", tags=["rnd"])


class ExperimentCreate(BaseModel):
    title: str
    subdomain: str | None = None  # "어떤 분야의 기록인가요?"
    summary: str


class SampleCreate(BaseModel):
    sample_code: str
    state: str = "진행 중"
    notes: str | None = None
    qc_evidence: str | None = None


@router.get("/sections")
def sections():
    return {
        "sections": [
            "새 실험 기록", "샘플 상태 기록", "샘플 히스토리 검색",
            "AI 실험 분석", "다음 실험 제안", "QC / 증거자료",
            "외부공개용 기술요약 요청",
        ],
        "subdomain_question": "어떤 분야의 기록인가요?",
        "subdomains": constants.RND_SUBDOMAINS,
    }


@router.post("/experiments")
def create_experiment(req: ExperimentCreate, db: Session = Depends(get_db)):
    grade = default_confidentiality("R&D", req.summary, None)  # -> restricted
    rd = models.RDExperimentLog(
        title=req.title, subdomain=req.subdomain,
        summary=req.summary, confidentiality=grade)
    db.add(rd); db.commit(); db.refresh(rd)
    return {"id": rd.id, "confidentiality": grade}


@router.post("/samples")
def create_sample(req: SampleCreate, db: Session = Depends(get_db)):
    grade = default_confidentiality("샘플/QC", req.notes or "", None)
    s = models.SampleStatusRecord(
        sample_code=req.sample_code, state=req.state, notes=req.notes,
        qc_evidence=req.qc_evidence, confidentiality=grade)
    db.add(s); db.commit(); db.refresh(s)
    return {"id": s.id, "confidentiality": grade}


@router.get("/samples")
def list_samples(db: Session = Depends(get_db)):
    rows = db.query(models.SampleStatusRecord).order_by(
        models.SampleStatusRecord.id.desc()).all()
    return [{"id": r.id, "sample_code": r.sample_code, "state": r.state,
             "confidentiality_ko": constants.confidentiality_ko(r.confidentiality)}
            for r in rows]

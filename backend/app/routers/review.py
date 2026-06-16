"""검수 / 외부공개 simplified release flow (Part 8).

This router exposes only the release flow. Every transition goes through the
preserved gates in safety.evaluate_release_gate. There is NO external sending
and NO publishing — only local export after the gate passes.
"""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import constants, models, schemas
from ..database import get_db
from ..safety import evaluate_release_gate, scan_sensitive

router = APIRouter(prefix="/review", tags=["review"])


def _output_or_404(db, output_id):
    o = db.get(models.Output, output_id)
    if not o:
        raise HTTPException(404, constants.MESSAGES["no_records"])
    return o


@router.get("/queue")
def queue(db: Session = Depends(get_db)):
    """The seven release-flow buckets (Part 8)."""
    def by_status(s):
        return [
            {
                "id": o.id, "title": o.title, "purpose": o.purpose,
                "confidentiality_ko": constants.confidentiality_ko(o.confidentiality),
                "risk_notes": o.risk_notes,
                "next_action": evaluate_release_gate(o).next_action,
            }
            for o in db.query(models.Output).filter(models.Output.status == s).all()
        ]
    return {
        "검수 대기": by_status("pending_qa"),
        "수정 필요": by_status("revision_required"),
        "법무/IP/표현 검토 필요": by_status("legal_review_needed"),
        "대표 승인 필요": by_status("human_approval_needed"),
        "외부공개 가능": by_status("release_ready"),
        "차단된 산출물": by_status("blocked"),
        "phrase_library": {
            "사용 가능": ["지속가능 소재", "동물성 가죽 대체 후보"],
            "주의": ["친환경 (근거 첨부 필요)"],
            "금지": ["100% 무해", "완전 분해 보장", "특정 미공개 파트너명"],
        },
    }


@router.post("/outputs", response_model=dict)
def create_output(req: schemas.OutputCreate, db: Session = Depends(get_db)):
    scan = scan_sensitive(req.body + " " + req.title)
    conf = req.confidentiality
    status = "draft"
    if scan.has_sensitive and conf == "public":
        conf = "restricted"
        status = "blocked"
    o = models.Output(
        title=req.title, body=req.body, purpose=req.purpose,
        agent_group=req.agent_group, confidentiality=conf,
        status=status, risk_notes=req.risk_notes)
    db.add(o); db.commit(); db.refresh(o)
    return {"id": o.id, "status": o.status,
            "confidentiality_ko": constants.confidentiality_ko(o.confidentiality)}


@router.post("/outputs/{output_id}/qa")
def run_qa(output_id: int, passed: bool, notes: str | None = None,
           db: Session = Depends(get_db)):
    """QA 검수 실행. Cannot pass sensitive content disguised as public."""
    o = _output_or_404(db, output_id)
    result = "pass" if passed else "revision"
    db.add(models.QAReview(output_id=o.id, result=result, notes=notes))
    o.qa_passed = passed
    o.status = "legal_review_needed" if passed else "revision_required"
    db.commit()
    return {"id": o.id, "status_ko": constants.status_ko(o.status)}


@router.post("/outputs/{output_id}/legal")
def run_legal(output_id: int, passed: bool, notes: str | None = None,
              db: Session = Depends(get_db)):
    """법무 검토 요청 — requires QA first."""
    o = _output_or_404(db, output_id)
    if not o.qa_passed:
        raise HTTPException(400, constants.MESSAGES["needs_qa"])
    db.add(models.LegalIPRecord(
        output_id=o.id, result="pass" if passed else "needs_legal", notes=notes))
    o.legal_passed = passed
    o.status = "human_approval_needed" if passed else "legal_review_needed"
    db.commit()
    return {"id": o.id, "status_ko": constants.status_ko(o.status)}


@router.post("/outputs/{output_id}/approve")
def human_approval(output_id: int, approved: bool, approver: str = "대표",
                   db: Session = Depends(get_db)):
    """대표 승인 요청 — requires QA + Legal first."""
    o = _output_or_404(db, output_id)
    if not o.qa_passed:
        raise HTTPException(400, constants.MESSAGES["needs_qa"])
    if not o.legal_passed:
        raise HTTPException(400, constants.MESSAGES["needs_legal"])
    db.add(models.Approval(output_id=o.id, approved=approved, approver=approver))
    o.human_approved = approved
    gate = evaluate_release_gate(o)
    o.status = gate.status
    db.commit()
    return {"id": o.id, "status_ko": constants.status_ko(o.status),
            "allowed": gate.allowed}


@router.get("/outputs/{output_id}/gate", response_model=schemas.GateResponse)
def gate_status(output_id: int, db: Session = Depends(get_db)):
    o = _output_or_404(db, output_id)
    g = evaluate_release_gate(o)
    return schemas.GateResponse(
        allowed=g.allowed, status=g.status,
        blocking_reasons=g.blocking_reasons, next_action=g.next_action)


@router.post("/outputs/{output_id}/release")
def create_release(output_id: int, db: Session = Depends(get_db)):
    """외부공개 후보 생성 — LOCAL export only, after the gate passes.

    No email, no web, no publishing. Writes a local file under ./exports.
    """
    o = _output_or_404(db, output_id)
    gate = evaluate_release_gate(o)
    if not gate.allowed:
        raise HTTPException(403, gate.blocking_reasons[0] if gate.blocking_reasons
                            else constants.MESSAGES["needs_release_approval"])
    os.makedirs("exports", exist_ok=True)
    path = os.path.join("exports", f"release_{o.id}.txt")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(f"{o.title}\n\n{o.body}\n")
    pkg = models.ReleasePackage(
        output_id=o.id, title=o.title, confidentiality=o.confidentiality,
        released=True, export_path=path)
    db.add(pkg); db.commit(); db.refresh(pkg)
    return {"id": pkg.id, "export_path": path, "note": "로컬 내보내기만 수행했습니다."}

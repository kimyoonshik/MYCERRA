"""사업 / 펀딩 / 투자 simplified page (Part 7)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db

router = APIRouter(prefix="/business", tags=["business"])


@router.get("/tabs")
def tabs():
    return {
        "tabs": ["와디즈 준비", "투자자 대응", "파트너 / B2B", "IR 자료", "시장 레이더"],
        "와디즈 준비": [
            "캠페인 현황", "리워드 구성", "상세페이지", "가격/KPI",
            "생산/배송", "서포터 커뮤니케이션", "펀딩 후 관리",
        ],
        "투자자 대응": [
            "투자자 목록", "미팅 기록", "후속작업", "IR 자료",
            "데이터룸", "실사 Q&A",
        ],
        "파트너 / B2B": [
            "파트너 목록", "샘플 요청", "협업 기회", "B2B 리드", "후속작업",
        ],
    }


@router.get("/crm")
def crm(org_type: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.CRMOrganization)
    if org_type:
        q = q.filter(models.CRMOrganization.org_type == org_type)
    rows = q.order_by(models.CRMOrganization.id.desc()).all()
    return [{"id": r.id, "name": r.name, "org_type": r.org_type} for r in rows]


@router.get("/campaigns")
def campaigns(db: Session = Depends(get_db)):
    rows = db.query(models.CrowdfundingCampaign).order_by(
        models.CrowdfundingCampaign.id.desc()).all()
    return [{"id": r.id, "title": r.title, "stage": r.stage} for r in rows]

"""찾기 / 자료보관 unified search (Part 9)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..search import unified_search

router = APIRouter(prefix="/search", tags=["search"])

FILTERS = ["전체", "R&D", "샘플", "펀딩", "투자자/파트너", "검수", "문서", "브리핑"]


@router.get("/", response_model=schemas.SearchResponse)
def search(q: str = "", filter: str = "전체", limit: int = 50,
           db: Session = Depends(get_db)):
    results = unified_search(db, q, filter, limit)
    return schemas.SearchResponse(
        query=q, filter=filter, count=len(results), results=results)


@router.get("/filters")
def filters():
    return {"filters": FILTERS,
            "placeholder": "문서, 샘플, 미팅, 결과물, 브리핑, 펀딩자료를 검색하세요."}

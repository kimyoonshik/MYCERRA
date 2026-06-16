"""Unified search (Part 9).

A single local query that fans out across every searchable record type and
returns a normalized result list. No external/web search is performed — this
only reads the local SQLite database.
"""

from __future__ import annotations

from sqlalchemy import or_
from sqlalchemy.orm import Session

from . import models

# Map a record type to (model, display-type-label, title-field, summary-field,
# searchable text fields, category-filter key).
_SOURCES = [
    (models.Document, "문서", "title", "body", ["title", "body"], "문서"),
    (models.DocumentChunk, "문서", None, "text", ["text"], "문서"),
    (models.Output, "결과물", "title", "body", ["title", "body", "purpose"], "검수"),
    (models.Briefing, "브리핑", None, "summary", ["summary"], "브리핑"),
    (models.DailyExecutionLog, "일일로그", None, "raw_text", ["raw_text", "author"], None),
    (models.RDExperimentLog, "R&D", "title", "summary", ["title", "summary", "subdomain"], "R&D"),
    (models.SampleStatusRecord, "샘플", "sample_code", "notes", ["sample_code", "notes", "qc_evidence"], "샘플"),
    (models.CRMOrganization, "투자자/파트너", "name", "notes", ["name", "notes"], "투자자/파트너"),
    (models.CRMInteraction, "투자자/파트너", None, "summary", ["summary"], "투자자/파트너"),
    (models.CrowdfundingCampaign, "펀딩", "title", "summary", ["title", "summary"], "펀딩"),
    (models.QAReview, "검수", None, "notes", ["notes", "result"], "검수"),
    (models.LegalIPRecord, "검수", None, "notes", ["notes", "result"], "검수"),
    (models.MarketSignal, "시장", "title", "detail", ["title", "detail"], None),
    (models.ReleasePackage, "릴리스", "title", None, ["title"], "검수"),
]


def _getval(obj, field):
    return getattr(obj, field, None) if field else None


def unified_search(db: Session, query: str, filt: str = "전체", limit: int = 50) -> list[dict]:
    q = (query or "").strip()
    results: list[dict] = []

    for model, type_label, title_field, summary_field, fields, cat_key in _SOURCES:
        # Apply category filter (Part 9). "전체" = everything.
        if filt not in ("전체", None) and filt != cat_key:
            # Special-case date/confidentiality filters handled by caller UI;
            # here we only filter by record category.
            if filt in ("R&D", "샘플", "펀딩", "투자자/파트너", "검수", "문서", "브리핑"):
                continue

        query_obj = db.query(model)
        if q:
            conds = []
            for f in fields:
                col = getattr(model, f, None)
                if col is not None:
                    conds.append(col.ilike(f"%{q}%"))
            if conds:
                query_obj = query_obj.filter(or_(*conds))

        for row in query_obj.limit(limit).all():
            title = _getval(row, title_field) or f"{type_label} #{row.id}"
            summary = (_getval(row, summary_field) or "")
            summary = summary[:160] + ("…" if len(summary) > 160 else "")
            results.append({
                "id": row.id,
                "title": title,
                "type": type_label,
                "date": getattr(row, "created_at", None).isoformat()
                if getattr(row, "created_at", None) else None,
                "classification": getattr(row, "confidentiality", "internal"),
                "summary": summary,
                "model": model.__tablename__,
            })

    results.sort(key=lambda r: r["date"] or "", reverse=True)
    return results[:limit]

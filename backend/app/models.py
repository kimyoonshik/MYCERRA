"""Backend data models.

Phase 14A restriction: these existing data models are PRESERVED. The
simplified UX is a thin operator-facing layer on top of them — no model is
removed, renamed away, or weakened.

Every operator-authored record carries a confidentiality grade and status so
the safety gates (QA / Legal-IP-Risk / Human Approval / Release Gate) can act
on it uniformly.
"""

from __future__ import annotations

import datetime as _dt

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)

from .database import Base


def _now() -> _dt.datetime:
    return _dt.datetime.utcnow()


class TimestampMixin:
    created_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)


# --- Core daily operating records ----------------------------------------
class DailyExecutionLog(Base, TimestampMixin):
    __tablename__ = "daily_execution_logs"
    id = Column(Integer, primary_key=True)
    log_date = Column(String, nullable=False)
    author = Column(String, nullable=False)
    raw_text = Column(Text, nullable=False)
    importance = Column(String, default="보통")  # 낮음/보통/높음
    confidentiality = Column(String, default="internal")
    category = Column(String, default="자료보관")
    related_sample = Column(String, nullable=True)


class RDExperimentLog(Base, TimestampMixin):
    __tablename__ = "rd_experiment_logs"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    subdomain = Column(String, nullable=True)  # 배양/가소/염색 ...
    summary = Column(Text, nullable=False)
    confidentiality = Column(String, default="restricted")  # sensitive R&D default
    status = Column(String, default="draft")
    source_log_id = Column(Integer, ForeignKey("daily_execution_logs.id"), nullable=True)


class SampleStatusRecord(Base, TimestampMixin):
    __tablename__ = "sample_status_records"
    id = Column(Integer, primary_key=True)
    sample_code = Column(String, nullable=False)
    state = Column(String, default="진행 중")
    notes = Column(Text, nullable=True)
    qc_evidence = Column(Text, nullable=True)
    confidentiality = Column(String, default="restricted")


class MeetingInteractionLog(Base, TimestampMixin):
    __tablename__ = "meeting_interaction_logs"
    id = Column(Integer, primary_key=True)
    counterpart = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    confidentiality = Column(String, default="internal")
    org_id = Column(Integer, ForeignKey("crm_organizations.id"), nullable=True)


class CRMOrganization(Base, TimestampMixin):
    __tablename__ = "crm_organizations"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    org_type = Column(String, default="investor")  # investor / partner / b2b
    confidentiality = Column(String, default="internal")
    notes = Column(Text, nullable=True)


class CRMInteraction(Base, TimestampMixin):
    __tablename__ = "crm_interactions"
    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, ForeignKey("crm_organizations.id"), nullable=True)
    summary = Column(Text, nullable=False)
    confidentiality = Column(String, default="internal")


class CrowdfundingCampaign(Base, TimestampMixin):
    __tablename__ = "crowdfunding_campaigns"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    stage = Column(String, default="준비")  # 준비/오픈예정/진행중/종료
    summary = Column(Text, nullable=True)
    confidentiality = Column(String, default="internal")


class CrowdfundingTask(Base, TimestampMixin):
    __tablename__ = "crowdfunding_tasks"
    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey("crowdfunding_campaigns.id"), nullable=True)
    title = Column(String, nullable=False)
    area = Column(String, default="상세페이지")
    done = Column(Boolean, default=False)


class NextAction(Base, TimestampMixin):
    __tablename__ = "next_actions"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    priority = Column(Integer, default=3)  # 1 = highest
    due_date = Column(String, nullable=True)
    done = Column(Boolean, default=False)
    overdue = Column(Boolean, default=False)
    source = Column(String, default="MASTER")
    source_log_id = Column(Integer, ForeignKey("daily_execution_logs.id"), nullable=True)


class PolicyFlag(Base, TimestampMixin):
    __tablename__ = "policy_flags"
    id = Column(Integer, primary_key=True)
    severity = Column(String, default="warning")  # info / warning / critical
    reason = Column(Text, nullable=False)
    matched_terms = Column(Text, nullable=True)
    record_type = Column(String, nullable=True)
    record_id = Column(Integer, nullable=True)
    resolved = Column(Boolean, default=False)


class DecisionRiskLog(Base, TimestampMixin):
    __tablename__ = "decision_risk_logs"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    detail = Column(Text, nullable=False)
    kind = Column(String, default="decision")  # decision / risk
    confidentiality = Column(String, default="internal")


# --- Knowledge / documents -----------------------------------------------
class Document(Base, TimestampMixin):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=True)
    confidentiality = Column(String, default="internal")


class DocumentChunk(Base, TimestampMixin):
    __tablename__ = "document_chunks"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    chunk_index = Column(Integer, default=0)
    text = Column(Text, nullable=False)


# --- Outputs, briefings, market, release ---------------------------------
class Output(Base, TimestampMixin):
    __tablename__ = "outputs"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    purpose = Column(String, nullable=True)  # 용도
    agent_group = Column(String, default="마스터")
    confidentiality = Column(String, default="internal")
    status = Column(String, default="draft")
    qa_passed = Column(Boolean, default=False)
    legal_passed = Column(Boolean, default=False)
    human_approved = Column(Boolean, default=False)
    risk_notes = Column(Text, nullable=True)  # 위험요소


class Briefing(Base, TimestampMixin):
    __tablename__ = "briefings"
    id = Column(Integer, primary_key=True)
    brief_date = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    confidentiality = Column(String, default="internal")


class QAReview(Base, TimestampMixin):
    __tablename__ = "qa_reviews"
    id = Column(Integer, primary_key=True)
    output_id = Column(Integer, ForeignKey("outputs.id"), nullable=True)
    result = Column(String, default="pending")  # pending / pass / revision
    notes = Column(Text, nullable=True)


class LegalIPRecord(Base, TimestampMixin):
    __tablename__ = "legal_ip_records"
    id = Column(Integer, primary_key=True)
    output_id = Column(Integer, ForeignKey("outputs.id"), nullable=True)
    result = Column(String, default="pending")  # pending / pass / needs_legal
    notes = Column(Text, nullable=True)


class Approval(Base, TimestampMixin):
    __tablename__ = "approvals"
    id = Column(Integer, primary_key=True)
    output_id = Column(Integer, ForeignKey("outputs.id"), nullable=True)
    approved = Column(Boolean, default=False)
    approver = Column(String, nullable=True)
    notes = Column(Text, nullable=True)


class MarketSignal(Base, TimestampMixin):
    __tablename__ = "market_signals"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    detail = Column(Text, nullable=True)
    confidentiality = Column(String, default="internal")


class ReleasePackage(Base, TimestampMixin):
    __tablename__ = "release_packages"
    id = Column(Integer, primary_key=True)
    output_id = Column(Integer, ForeignKey("outputs.id"), nullable=True)
    title = Column(String, nullable=False)
    confidentiality = Column(String, default="public")
    released = Column(Boolean, default=False)
    export_path = Column(String, nullable=True)  # local export only


# A small index of every searchable record type, so unified search and the
# "no backend route/model removed" tests can introspect coverage.
SEARCHABLE_MODELS = [
    Document,
    DocumentChunk,
    Output,
    Briefing,
    DailyExecutionLog,
    RDExperimentLog,
    SampleStatusRecord,
    CRMOrganization,
    CRMInteraction,
    CrowdfundingCampaign,
    QAReview,
    LegalIPRecord,
    MarketSignal,
    ReleasePackage,
]

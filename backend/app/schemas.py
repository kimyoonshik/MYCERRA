"""Pydantic request/response schemas for the simplified API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class DailyInputCreate(BaseModel):
    log_date: str
    author: str
    raw_text: str = Field(..., description="자유 입력")
    importance: str = "보통"
    confidentiality: str | None = None
    related_sample: str | None = None
    attachment_document_id: int | None = None


class ClassifyRequest(BaseModel):
    raw_text: str
    confidentiality: str | None = None


class ClassifyResponse(BaseModel):
    category: str
    confidence: float
    confidentiality: str
    sensitive: bool
    matched_terms: list[str]
    proposed_records: list[str]
    create_policy_flag: bool


class OutputCreate(BaseModel):
    title: str
    body: str
    purpose: str | None = None
    agent_group: str = "마스터"
    confidentiality: str = "internal"
    risk_notes: str | None = None


class SearchResponse(BaseModel):
    query: str
    filter: str
    count: int
    results: list[dict]


class GateResponse(BaseModel):
    allowed: bool
    status: str
    blocking_reasons: list[str]
    next_action: str

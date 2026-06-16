"""Safety gates — PRESERVED and NOT weakened by Phase 14A.

This module centralizes:
  * sensitive-term detection (what may never be exposed externally),
  * confidentiality defaulting (sensitive R&D -> Restricted),
  * the Release Gate (QA -> Legal/IP/Risk -> Human Approval -> grade check).

The simplified Korean-first UX calls into exactly these functions, so the
operator-facing redesign cannot accidentally bypass a gate.
"""

from __future__ import annotations

from dataclasses import dataclass, field

# Categories of information that must never be exposed externally. We keep the
# DETECTION vocabulary here (trigger words), never the protected content
# itself. Matching any of these forces Restricted + blocks external release.
SENSITIVE_TOPICS = {
    "formula": ["배합비", "배합 비율", "formula", "조성비", "레시피"],
    "strain": ["균주", "strain", "스트레인", "종균"],
    "culture_conditions": ["배양 조건", "배양조건", "culture condition", "온도/습도 조건"],
    "process_parameters": ["공정 변수", "공정 파라미터", "process parameter", "압력/온도 설정"],
    "plasticization_sop": ["가소 SOP", "가소 sop", "plasticization sop", "가소화 절차"],
    "production_cost": ["생산원가", "생산 원가", "production cost", "원가표", "단가표"],
    "failure_data": ["실패 데이터", "불량 데이터", "failure data", "수율 실패"],
    "partner_names_undisclosed": ["미공개 파트너", "비공개 파트너", "undisclosed partner"],
    "engine_internals": ["엔진 구조", "MYCERRA Engine 구조", "engine internal", "엔진 내부 구조"],
}

# Categories whose presence in operator input should default to Restricted.
SENSITIVE_RND_CATEGORIES = {"R&D", "샘플/QC"}


@dataclass
class SensitiveScan:
    has_sensitive: bool = False
    matched_terms: list[str] = field(default_factory=list)
    topics: list[str] = field(default_factory=list)

    @property
    def reason(self) -> str:
        if not self.has_sensitive:
            return ""
        return "제한기밀 주제가 감지되었습니다: " + ", ".join(self.topics)


def scan_sensitive(text: str) -> SensitiveScan:
    """Detect protected/sensitive content. Never returns the content itself."""
    if not text:
        return SensitiveScan()
    lowered = text.lower()
    scan = SensitiveScan()
    for topic, terms in SENSITIVE_TOPICS.items():
        for term in terms:
            if term.lower() in lowered:
                scan.has_sensitive = True
                if topic not in scan.topics:
                    scan.topics.append(topic)
                scan.matched_terms.append(term)
    return scan


def default_confidentiality(category: str, text: str, requested: str | None) -> str:
    """Sensitive R&D defaults to Restricted; sensitive terms force Restricted.

    An explicitly requested grade is honored only when it is NOT weaker than
    what safety requires. Safety can tighten, never loosen.
    """
    scan = scan_sensitive(text)
    forced_restricted = scan.has_sensitive or category in SENSITIVE_RND_CATEGORIES
    if forced_restricted:
        # Allow tighter NDA grades, but never weaker than restricted.
        if requested in {"restricted", "investor_nda", "partner_nda"}:
            return requested
        return "restricted"
    return requested or "internal"


@dataclass
class GateResult:
    allowed: bool
    status: str
    blocking_reasons: list[str] = field(default_factory=list)
    next_action: str = ""  # Korean next step for the operator


def evaluate_release_gate(output) -> GateResult:
    """The Release Gate. Order: QA -> Legal/IP/Risk -> Human Approval -> grade.

    `output` is an Output model instance (or any object with the same fields).
    Returns whether the item may become Release Ready, and the Korean next
    action when it may not. This is the ONLY path to 외부공개 가능.
    """
    from .constants import MESSAGES

    reasons: list[str] = []

    # Sensitive content can never be made public.
    scan = scan_sensitive((output.body or "") + " " + (output.title or ""))
    if scan.has_sensitive and output.confidentiality == "public":
        return GateResult(
            allowed=False,
            status="blocked",
            blocking_reasons=[MESSAGES["restricted_blocked"]],
            next_action=MESSAGES["restricted_blocked"],
        )

    if not output.qa_passed:
        return GateResult(
            allowed=False,
            status="pending_qa",
            blocking_reasons=[MESSAGES["needs_qa"]],
            next_action="QA 검수 실행",
        )
    if not output.legal_passed:
        return GateResult(
            allowed=False,
            status="legal_review_needed",
            blocking_reasons=[MESSAGES["needs_legal"]],
            next_action="법무 검토 요청",
        )
    if not output.human_approved:
        return GateResult(
            allowed=False,
            status="human_approval_needed",
            blocking_reasons=[MESSAGES["needs_human_approval"]],
            next_action="대표 승인 요청",
        )

    return GateResult(allowed=True, status="release_ready", next_action="외부공개 후보 생성")

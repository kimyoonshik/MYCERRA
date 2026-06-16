"""Free-form input classification (Part 5).

Heuristic, deterministic, offline classifier. It maps a single free-form
operator note into one of the fixed CATEGORIES and proposes which records to
create. Validation is intentionally strict — the redesign must NOT weaken
classification validation, so unknown categories are rejected.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .constants import CATEGORIES
from .safety import default_confidentiality, scan_sensitive

# Keyword cues per category (Korean-first). Order matters: earlier categories
# win ties for more specific intents.
_CUES = {
    "샘플/QC": ["샘플", "qc", "시험", "물성", "인장", "두께", "외관검사", "증거자료"],
    "R&D": ["실험", "배양", "가소", "염색", "히트프레스", "엠보싱", "후가공",
            "pha", "apha", "수확", "매트", "스케일업", "균사", "공정", "r&d"],
    "클라우드펀딩": ["와디즈", "wadiz", "펀딩", "크라우드", "리워드", "서포터",
                "상세페이지", "캠페인"],
    "투자자/파트너": ["투자자", "ir", "vc", "파트너", "협력", "b2b", "미팅",
                 "데이터룸", "실사", "텀시트", "라운드"],
    "법무/검수": ["법무", "ip", "특허", "상표", "검수", "리스크", "표현", "클레임",
              "규제", "인증"],
    "일정/할 일": ["할 일", "todo", "마감", "일정", "다음 액션", "데드라인", "약속"],
}


@dataclass
class ClassificationResult:
    category: str
    confidence: float
    confidentiality: str
    sensitive: bool
    matched_terms: list[str] = field(default_factory=list)
    proposed_records: list[str] = field(default_factory=list)
    create_policy_flag: bool = False


def _score(text_lower: str) -> dict[str, int]:
    scores = {c: 0 for c in CATEGORIES}
    for category, cues in _CUES.items():
        for cue in cues:
            if cue in text_lower:
                scores[category] += 1
    return scores


def classify(text: str, requested_confidentiality: str | None = None) -> ClassificationResult:
    if not text or not text.strip():
        # Empty input still validates to a safe default; never invents content.
        return ClassificationResult(
            category="자료보관",
            confidence=0.0,
            confidentiality=requested_confidentiality or "internal",
            sensitive=False,
            proposed_records=["daily_execution_logs"],
        )

    lowered = text.lower()
    scores = _score(lowered)
    best = max(scores, key=lambda c: scores[c])
    top = scores[best]
    category = best if top > 0 else "자료보관"
    total = sum(scores.values()) or 1
    confidence = round(top / total, 3) if top else 0.0

    scan = scan_sensitive(text)
    grade = default_confidentiality(category, text, requested_confidentiality)

    proposed = ["daily_execution_logs"]
    if category == "R&D":
        proposed.append("rd_experiment_logs")
    if category == "샘플/QC":
        proposed.append("sample_status_records")
    if category == "투자자/파트너":
        proposed += ["meeting_interaction_logs", "crm_interactions"]
    if category == "클라우드펀딩":
        proposed.append("crowdfunding_tasks")
    if category == "법무/검수":
        proposed.append("decision_risk_logs")
    # Every classified input proposes a follow-up action.
    proposed.append("next_actions")

    return ClassificationResult(
        category=category,
        confidence=confidence,
        confidentiality=grade,
        sensitive=scan.has_sensitive,
        matched_terms=scan.matched_terms,
        proposed_records=proposed,
        create_policy_flag=scan.has_sensitive,
    )


def validate_category(category: str) -> None:
    """Strict validation — unknown categories are rejected (not weakened)."""
    if category not in CATEGORIES:
        raise ValueError(f"알 수 없는 분류입니다: {category}")

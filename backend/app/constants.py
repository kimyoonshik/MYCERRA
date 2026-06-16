"""Korean-first constant vocabulary for MYCERRA Harness Agent OS.

Single source of truth for operator-facing labels. Every label is
Korean-first with an English helper, per the Phase 14A UI policy.

NOTE (safety): This module intentionally never contains formulas, strains,
culture conditions, process parameters, plasticization SOP, production cost,
failure data, undisclosed partner names, or MYCERRA Engine internals. It only
holds UI vocabulary and routing metadata.
"""

from __future__ import annotations

# --- Simplified main navigation (Part 1) ---------------------------------
MAIN_MENUS = [
    {"key": "today", "ko": "오늘", "en": "HOME / Daily Command"},
    {"key": "daily_input", "ko": "오늘 입력", "en": "Daily Input"},
    {"key": "rnd", "ko": "R&D / 샘플", "en": "R&D / Samples"},
    {"key": "business", "ko": "사업 / 펀딩 / 투자", "en": "Business / Funding / Investment"},
    {"key": "review", "ko": "검수 / 외부공개", "en": "Review / Release"},
    {"key": "search", "ko": "찾기 / 자료보관", "en": "Search / Archive"},
    {"key": "advanced", "ko": "고급 메뉴", "en": "Advanced"},
]

DEFAULT_MENU = "today"

# --- Advanced workbenches moved under 고급 메뉴 (Part 2 / Part 13) ---------
# These are NOT deleted; they remain reachable, just secondary.
ADVANCED_MENUS = [
    {"key": "agent_runs", "ko": "에이전트 실행", "en": "Agent Runs"},
    {"key": "tasks_next", "ko": "할 일 / 다음 액션", "en": "Tasks & Next Actions"},
    {"key": "master_briefings", "ko": "마스터 브리핑", "en": "MASTER Briefings"},
    {"key": "process_rnd_wb", "ko": "PROCESS / R&D 워크벤치", "en": "PROCESS/R&D Workbench"},
    {"key": "crowdfunding_wb", "ko": "크라우드펀딩 워크벤치", "en": "Crowdfunding Workbench"},
    {"key": "approval_release", "ko": "승인 / 릴리스 게이트", "en": "Approval & Release Gate"},
    {"key": "documents_kb", "ko": "문서 / 지식베이스", "en": "Documents & Knowledge Base"},
    {"key": "debates", "ko": "토론 / 디베이트", "en": "Debates"},
    {"key": "scheduler", "ko": "스케줄러 / 자동운영", "en": "Scheduler & AUTO-OPS"},
    {"key": "risk_flags", "ko": "리스크 / 정책 플래그", "en": "Risk & Policy Flags"},
    {"key": "backup_restore", "ko": "백업 / 복구", "en": "Backup & Restore"},
    {"key": "qa_review", "ko": "QA / 검수", "en": "QA / Review"},
    {"key": "daily_logs", "ko": "일일 입력 / 로그", "en": "Daily Input / Logs"},
    {"key": "crm", "ko": "투자자 / 파트너 CRM", "en": "Investor / Partner CRM"},
    {"key": "ir_dataroom", "ko": "IR / 데이터룸", "en": "IR / Data Room"},
    {"key": "legal_ip", "ko": "법무 / IP / 클레임", "en": "Legal / IP / Claims"},
    {"key": "market_radar", "ko": "시장 / 경쟁사 레이더", "en": "Market / Competitor Radar"},
    {"key": "system_health", "ko": "시스템 상태", "en": "System Health"},
]

# --- Classification categories (Part 5) ----------------------------------
CATEGORIES = [
    "R&D",
    "샘플/QC",
    "클라우드펀딩",
    "투자자/파트너",
    "법무/검수",
    "일정/할 일",
    "자료보관",
]

# --- Confidentiality grades (Part 3) -------------------------------------
CONFIDENTIALITY = [
    {"key": "internal", "ko": "내부용", "en": "Internal"},
    {"key": "restricted", "ko": "제한기밀", "en": "Restricted"},
    {"key": "investor_nda", "ko": "투자자 NDA용", "en": "Investor-NDA"},
    {"key": "partner_nda", "ko": "파트너 NDA용", "en": "Partner-NDA"},
    {"key": "public", "ko": "공개용", "en": "Public"},
]
CONFIDENTIALITY_KEYS = [c["key"] for c in CONFIDENTIALITY]

# --- Workflow statuses (Part 3) ------------------------------------------
STATUSES = [
    {"key": "draft", "ko": "초안", "en": "Draft"},
    {"key": "in_progress", "ko": "진행 중", "en": "In Progress"},
    {"key": "pending_qa", "ko": "검수 대기", "en": "Pending QA"},
    {"key": "revision_required", "ko": "수정 필요", "en": "Revision Required"},
    {"key": "legal_review_needed", "ko": "법무 검토 필요", "en": "Legal Review Needed"},
    {"key": "human_approval_needed", "ko": "대표 승인 필요", "en": "Human Approval Needed"},
    {"key": "release_ready", "ko": "외부공개 가능", "en": "Release Ready"},
    {"key": "blocked", "ko": "차단됨", "en": "Blocked"},
]
STATUS_KEYS = [s["key"] for s in STATUSES]

# --- Consolidated visible agent groups (Part 10) -------------------------
# Maps simplified operator-facing groups to the underlying detailed agents.
AGENT_GROUPS = {
    "마스터": {
        "en": "MASTER",
        "detailed_agents": ["MASTER Agent"],
    },
    "R&D": {
        "en": "R&D",
        "detailed_agents": [
            "PROCESS/R&D Agent",
            "배양", "수확·매트선별", "가소", "염색", "히트프레스",
            "엠보싱", "후가공", "PHA/aPHA", "QC/시험", "스케일업/생산",
        ],
    },
    "사업": {
        "en": "Business",
        "detailed_agents": [
            "Crowdfunding Agent", "IR Agent", "CRM Agent", "Market Radar Agent",
        ],
    },
    "검수": {
        "en": "Review",
        "detailed_agents": [
            "QA Agent", "Legal/IP/Risk Agent", "Release Gate Agent",
        ],
    },
    "찾기": {
        "en": "Search",
        "detailed_agents": ["Documents/Knowledge Base Agent", "Search Agent"],
    },
}

# R&D internal subdomains kept available (Part 6). The operator never has to
# pick an "agent" — the UI asks "어떤 분야의 기록인가요?" with these options.
RND_SUBDOMAINS = [
    "배양", "수확·매트선별", "가소", "염색", "히트프레스",
    "엠보싱", "후가공", "PHA/aPHA", "QC/시험", "스케일업/생산",
]

# --- Korean-first error / empty states (Part 12) -------------------------
MESSAGES = {
    "api_unreachable": "FastAPI에 연결할 수 없습니다.",
    "no_records": "아직 표시할 기록이 없습니다.",
    "needs_release_approval": "이 항목은 외부공개 승인이 필요합니다.",
    "restricted_blocked": "제한기밀 정보가 포함되어 있어 공개용으로 사용할 수 없습니다.",
    "needs_qa": "먼저 QA 검수를 통과해야 합니다.",
    "needs_legal": "먼저 법무/IP/리스크 검토가 필요합니다.",
    "needs_human_approval": "먼저 대표 승인이 필요합니다.",
    "no_briefing_today": "아직 오늘 브리핑이 없습니다.",
}


def status_ko(key: str) -> str:
    for s in STATUSES:
        if s["key"] == key:
            return f'{s["ko"]} / {s["en"]}'
    return key


def confidentiality_ko(key: str) -> str:
    for c in CONFIDENTIALITY:
        if c["key"] == key:
            return f'{c["ko"]} / {c["en"]}'
    return key

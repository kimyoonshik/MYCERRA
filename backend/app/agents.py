"""Agent consolidation layer (Part 10).

Existing detailed agents stay internal. The operator only ever sees five
consolidated groups. This module records agent runs and resolves a simplified
group to the detailed agent that actually does the work.
"""

from __future__ import annotations

from .constants import AGENT_GROUPS


def visible_groups() -> list[str]:
    return list(AGENT_GROUPS.keys())


def detailed_agents_for(group: str) -> list[str]:
    info = AGENT_GROUPS.get(group)
    return list(info["detailed_agents"]) if info else []


def resolve_group(detailed_agent: str) -> str | None:
    """Reverse map a detailed/internal agent to its visible group."""
    for group, info in AGENT_GROUPS.items():
        if detailed_agent in info["detailed_agents"]:
            return group
    return None


# A pure, offline "run" that never reaches the network. It produces a draft
# Output that must still pass every safety gate before any external use.
def run_group(group: str, instruction: str) -> dict:
    if group not in AGENT_GROUPS:
        raise ValueError(f"알 수 없는 에이전트 그룹입니다: {group}")
    return {
        "group": group,
        "detailed_agents": detailed_agents_for(group),
        "instruction": instruction,
        "note": "내부 실행만 수행했습니다. 외부 전송/검색/공개는 하지 않습니다.",
    }

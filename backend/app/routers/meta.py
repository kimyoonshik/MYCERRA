"""Navigation + Korean-first label metadata (Parts 1, 2, 3, 10, 12)."""

from __future__ import annotations

from fastapi import APIRouter

from .. import constants
from ..agents import detailed_agents_for, visible_groups

router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("/navigation")
def navigation():
    """Seven Korean-first main menus + advanced submenu. Default opens 오늘."""
    return {
        "default_menu": constants.DEFAULT_MENU,
        "main_menus": constants.MAIN_MENUS,
        "advanced_menus": constants.ADVANCED_MENUS,
    }


@router.get("/labels")
def labels():
    return {
        "statuses": constants.STATUSES,
        "confidentiality": constants.CONFIDENTIALITY,
        "categories": constants.CATEGORIES,
        "rnd_subdomains": constants.RND_SUBDOMAINS,
        "messages": constants.MESSAGES,
    }


@router.get("/agent-groups")
def agent_groups():
    return {
        "visible_groups": visible_groups(),
        "mapping": {g: detailed_agents_for(g) for g in visible_groups()},
    }

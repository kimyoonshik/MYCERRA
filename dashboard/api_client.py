"""Thin HTTP client for the local FastAPI backend.

All Korean-first error handling lives here so every view shows the same
operator-friendly message when the backend is unreachable.
"""

from __future__ import annotations

import os

import requests

API_BASE = os.environ.get("MYCERRA_API_BASE", "http://127.0.0.1:8000")
API_UNREACHABLE = "FastAPI에 연결할 수 없습니다."


class ApiError(Exception):
    pass


def _url(path: str) -> str:
    return f"{API_BASE}{path}"


def get(path: str, params: dict | None = None):
    try:
        r = requests.get(_url(path), params=params, timeout=10)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError as exc:  # backend down
        raise ApiError(API_UNREACHABLE) from exc
    except requests.exceptions.RequestException as exc:
        raise ApiError(str(exc)) from exc


def post(path: str, json: dict | None = None, params: dict | None = None):
    try:
        r = requests.post(_url(path), json=json, params=params, timeout=15)
        if r.status_code >= 400:
            try:
                raise ApiError(r.json().get("detail", r.text))
            except ValueError:
                raise ApiError(r.text)
        return r.json()
    except requests.exceptions.ConnectionError as exc:
        raise ApiError(API_UNREACHABLE) from exc
    except requests.exceptions.RequestException as exc:
        raise ApiError(str(exc)) from exc

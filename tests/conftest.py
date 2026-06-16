"""Pytest fixtures — each test run uses an isolated temp SQLite DB."""

from __future__ import annotations

import importlib
import os
import sys
import tempfile

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)


@pytest.fixture()
def client():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.environ["MYCERRA_DB_URL"] = f"sqlite:///{path}"

    # Reload modules so the new DB_URL takes effect.
    import backend.app.database as database
    importlib.reload(database)
    import backend.app.models as models
    importlib.reload(models)
    for name in list(sys.modules):
        if name.startswith("backend.app.routers") or name == "backend.app.main":
            sys.modules.pop(name, None)
    import backend.app.main as main
    importlib.reload(main)

    from fastapi.testclient import TestClient
    main.init_db()
    with TestClient(main.app) as c:
        c.app_ref = main.app  # expose app for route introspection
        yield c

    os.remove(path)

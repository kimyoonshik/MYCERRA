"""SQLite + SQLAlchemy setup.

A single local SQLite database backs every record type. The database file
location is configurable via MYCERRA_DB_URL so tests can use a temp file.
No data ever leaves the machine.
"""

from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_URL = os.environ.get("MYCERRA_DB_URL", "sqlite:///./mycerra.db")

engine = create_engine(
    DB_URL,
    connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import models so they register with Base before create_all.
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

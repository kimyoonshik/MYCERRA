#!/usr/bin/env bash
# Local-only launcher for the MYCERRA Harness Agent OS (Phase 14A).
# Backend on 127.0.0.1 only — never exposed publicly.
set -euo pipefail

uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
trap 'kill $BACKEND_PID' EXIT

# Korean-first operator dashboard, bound to localhost.
streamlit run dashboard/app.py \
  --server.address 127.0.0.1 \
  --server.headless true

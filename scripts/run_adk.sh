#!/usr/bin/env bash
set -euo pipefail
export GOOGLE_API_KEY=*** /tmp/adk_key)
export AGENT_RUNTIME=adk
export VIRTUAL_ENV=
export PYTHONPATH=backend/src

cd ~/src/relocation-scout
exec .venv/bin/uvicorn relocation_scout.main:app --host 0.0.0.0 --port 8000

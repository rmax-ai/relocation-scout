#!/usr/bin/env python3
"""Start Relocation Scout backend in ADK mode."""
import os, subprocess, sys

# Read Gemini API key
key = subprocess.run(
    ["pass", "hermes/gemini/api-key"],
    capture_output=True, text=True,
    env={**os.environ, "PASSWORD_STORE_DIR": "/home/rmax-10/.password-store"},
).stdout.strip()

os.environ["GOOGLE_API_KEY"] = key
os.environ["AGENT_RUNTIME"] = "adk"

os.chdir(os.path.expanduser("~/src/relocation-scout"))
sys.path.insert(0, os.path.join(os.getcwd(), "backend/src"))

# Start uvicorn
import uvicorn
uvicorn.run("relocation_scout.main:app", host="0.0.0.0", port=8000)

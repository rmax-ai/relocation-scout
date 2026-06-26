from __future__ import annotations

import time
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from relocation_scout.api.actions import router as actions_router
from relocation_scout.api.audit import router as audit_router
from relocation_scout.api.demo import router as demo_router
from relocation_scout.api.listings import router as listings_router
from relocation_scout.api.searches import router as searches_router
from relocation_scout.api.workflow import router as workflow_router
from relocation_scout.config import settings
from relocation_scout.observability.logging import setup_logging
from relocation_scout.persistence.database import init_db

START_TIME = time.monotonic()


async def verify_google_api_key(api_key: str) -> None:
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    payload = {
        "contents": [{"parts": [{"text": "Reply with OK"}]}],
        "generationConfig": {"maxOutputTokens": 8, "temperature": 0},
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(url, params={"key": api_key}, json=payload)

    if response.status_code != 200:
        detail = ""
        try:
            detail = response.json().get("error", {}).get("message", "")
        except ValueError:
            detail = response.text[:200]
        raise RuntimeError(
            f"Gemini API key validation failed ({response.status_code}): {detail or 'unknown error'}"
        )


async def validate_runtime_configuration() -> None:
    if settings.agent_runtime != "adk":
        return
    if not settings.google_api_key:
        raise ValueError("GOOGLE_API_KEY required when AGENT_RUNTIME=adk")
    await verify_google_api_key(settings.google_api_key)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    await validate_runtime_configuration()
    await init_db()
    yield


app = FastAPI(
    title="Relocation Scout",
    description="Production-oriented agentic systems PoC — house-hunting assistant with governed AI workflow",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(searches_router)
app.include_router(workflow_router)
app.include_router(listings_router)
app.include_router(actions_router)
app.include_router(audit_router)
app.include_router(demo_router)


@app.get("/api/health")
async def health():
    database = "sqlite" if settings.database_url.startswith("sqlite") else "unknown"
    return {
        "status": "ok",
        "version": app.version,
        "agent_runtime": settings.agent_runtime,
        "database": database,
        "uptime_seconds": int(time.monotonic() - START_TIME),
    }

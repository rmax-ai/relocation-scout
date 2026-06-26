from __future__ import annotations

import time
from contextlib import asynccontextmanager

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
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

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.contracts.demo import DemoFailures, DemoFailuresPatch
from relocation_scout.dependencies import get_session
from relocation_scout.persistence.database import drop_db, init_db
from relocation_scout.workflow.failure_injection import (
    get_demo_failures,
    reset_demo_failures,
    update_demo_failures,
)

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.post("/seed")
async def seed_database(session: AsyncSession = Depends(get_session)):
    """Initialize database tables. Listing data is loaded from JSON fixtures at runtime."""
    await init_db()
    return {
        "status": "ready",
        "message": "Database initialized. Listings load from data/*.json at workflow runtime.",
    }


@router.post("/reset")
async def reset_demo(session: AsyncSession = Depends(get_session)):
    await drop_db()
    await init_db()
    reset_demo_failures()
    return {"status": "reset", "message": "Database dropped and recreated"}


@router.post("/failures", response_model=DemoFailures)
async def set_failure_injection(body: DemoFailuresPatch) -> DemoFailures:
    return update_demo_failures(body)


@router.get("/failures", response_model=DemoFailures)
async def get_failure_config() -> DemoFailures:
    return get_demo_failures()

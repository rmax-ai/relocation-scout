from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.dependencies import get_session
from relocation_scout.persistence.database import drop_db, init_db

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
    return {"status": "reset", "message": "Database dropped and recreated"}


@router.post("/failures")
async def set_failure_injection(body: dict, session: AsyncSession = Depends(get_session)):
    """Enable failure injection for specific scenarios."""
    failure_type = body.get("type", "")
    enabled = body.get("enabled", True)

    # Store failure injection config in session state
    # For now, log the request
    return {"status": "configured", "failure_type": failure_type, "enabled": enabled}


@router.get("/failures")
async def get_failure_config():
    return {
        "available_failures": [
            "malformed_agent_output",
            "neighbourhood_agent_failure",
            "commute_service_timeout",
            "crash_before_email_send",
            "crash_after_email_send",
            "crash_before_persist",
            "duplicate_workflow",
            "email_fail",
        ]
    }

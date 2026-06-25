from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.dependencies import get_session
from relocation_scout.persistence.unit_of_work import UnitOfWork
from relocation_scout.workflow.controller import WorkflowController

router = APIRouter(prefix="/api/searches/{search_id}", tags=["listings"])


@router.get("/listings", response_model=list[dict])
async def get_listings(
    search_id: str,
    recommendation: str | None = Query(None),
    neighbourhood: str | None = Query(None),
    suspicious: bool | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    """Get listings for a search with optional filters."""
    controller = WorkflowController(session)
    state = await controller.get_workflow_state(search_id)

    listings = []
    commutes = {}
    evaluations = {}

    if state and state.status.value not in ("created",):
        # Try to get from controller context
        # For now, return empty if workflow hasn't progressed
        pass

    return listings


@router.get("/listings/{listing_id}")
async def get_listing_detail(
    search_id: str, listing_id: str, session: AsyncSession = Depends(get_session)
):
    uow = UnitOfWork(session)
    record = await uow.listings.get(listing_id)
    if not record:
        raise HTTPException(404, "Listing not found")

    return {
        "listing_id": record.id,
        "provider": record.provider,
        "title": record.title,
        "address": record.address,
        "neighbourhood": record.neighbourhood,
        "monthly_rent_eur": record.monthly_rent_eur,
        "bedrooms": record.bedrooms,
        "area_m2": record.area_m2,
        "source_url": record.source_url,
        "description": record.description,
        "is_suspicious": record.is_suspicious,
        "suspicion_reasons": json.loads(record.suspicion_reasons_json),
    }


@router.get("/shortlist")
async def get_shortlist(search_id: str, session: AsyncSession = Depends(get_session)):
    controller = WorkflowController(session)
    state = await controller.get_workflow_state(search_id)

    if not state or state.status.value in ("created", "listings_fetched", "listings_normalized"):
        return {"search_id": search_id, "entries": [], "summary": "", "comparison_notes": ""}

    return {
        "search_id": search_id,
        "entries": [],
        "summary": "Shortlist being generated...",
        "comparison_notes": "",
    }

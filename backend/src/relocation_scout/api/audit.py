from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.dependencies import get_session
from relocation_scout.observability.tracing import metrics
from relocation_scout.persistence.unit_of_work import UnitOfWork

router = APIRouter(prefix="/api", tags=["audit"])


@router.get("/searches/{search_id}/audit")
async def get_audit_log(
    search_id: str,
    limit: int = Query(100, le=500),
    event_type: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    uow = UnitOfWork(session)
    events = await uow.audit_events.get_by_search(search_id, limit)

    result = []
    for e in events:
        if event_type and e.event_type != event_type:
            continue
        result.append(
            {
                "event_id": e.id,
                "timestamp": e.timestamp.isoformat(),
                "event_type": e.event_type,
                "actor": e.actor,
                "workflow_step": e.workflow_step,
                "entity_type": e.entity_type,
                "entity_id": e.entity_id,
                "message": e.message,
                "metadata": json.loads(e.metadata_json),
                "trace_id": e.trace_id,
            }
        )

    return result


@router.get("/searches/{search_id}/audit/export")
async def export_audit_log(search_id: str, session: AsyncSession = Depends(get_session)):
    uow = UnitOfWork(session)
    events = await uow.audit_events.get_by_search(search_id, 1000)

    data = []
    for e in events:
        data.append(
            {
                "event_id": e.id,
                "timestamp": e.timestamp.isoformat(),
                "event_type": e.event_type,
                "actor": e.actor,
                "message": e.message,
                "metadata": json.loads(e.metadata_json),
            }
        )

    return JSONResponse(content=data)


@router.get("/metrics")
async def get_metrics():
    return metrics.snapshot()

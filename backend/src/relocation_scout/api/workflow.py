from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.api.models import WorkflowStatusResponse
from relocation_scout.dependencies import get_session
from relocation_scout.persistence.unit_of_work import UnitOfWork
from relocation_scout.workflow.controller import WorkflowController

router = APIRouter(prefix="/api/searches/{search_id}/workflow", tags=["workflow"])


@router.get("", response_model=WorkflowStatusResponse)
async def get_workflow(search_id: str, session: AsyncSession = Depends(get_session)):
    controller = WorkflowController(session)
    state = await controller.get_workflow_state(search_id)
    if not state:
        raise HTTPException(404, "No workflow found")

    return WorkflowStatusResponse(
        search_id=search_id,
        status=state.status.value,
        prior_status=state.prior_status.value if state.prior_status else None,
        current_step=state.current_step,
        completed_steps=state.completed_steps,
        retry_count=state.retry_count,
        last_error=state.last_error,
        resumable=state.resumable,
        created_at=state.created_at.isoformat(),
        updated_at=state.updated_at.isoformat(),
    )


@router.get("/steps")
async def get_workflow_steps(search_id: str, session: AsyncSession = Depends(get_session)):
    """Return all workflow step executions for a search."""
    uow = UnitOfWork(session)
    run = await uow.workflow_runs.get_latest(search_id)
    if not run:
        raise HTTPException(404, "No workflow found")

    steps = await uow.step_executions.get_by_workflow_run(run.id)
    return [
        {
            "id": s.id,
            "step_name": s.step_name,
            "status": s.status,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "duration_ms": s.duration_ms,
            "retry_count": s.retry_count,
            "error_message": s.error_message,
            "input_summary": json.loads(s.input_summary_json) if s.input_summary_json else None,
            "output_summary": json.loads(s.output_summary_json) if s.output_summary_json else None,
        }
        for s in steps
    ]


@router.post("/retry")
async def retry_workflow(search_id: str, session: AsyncSession = Depends(get_session)):
    controller = WorkflowController(session)
    state = await controller.resume_workflow(search_id)
    return WorkflowStatusResponse(
        search_id=search_id,
        status=state.status.value,
        prior_status=state.prior_status.value if state.prior_status else None,
        current_step=state.current_step,
        completed_steps=state.completed_steps,
        retry_count=state.retry_count,
        last_error=state.last_error,
        resumable=state.resumable,
    )

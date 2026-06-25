from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.api.models import SearchCreateRequest, SearchResponse, WorkflowStatusResponse
from relocation_scout.dependencies import get_session
from relocation_scout.persistence.unit_of_work import UnitOfWork
from relocation_scout.workflow.controller import WorkflowController

router = APIRouter(prefix="/api/searches", tags=["searches"])


@router.post("", response_model=SearchResponse)
async def create_search(
    body: SearchCreateRequest,
    session: AsyncSession = Depends(get_session),
):
    uow = UnitOfWork(session)
    preferences_json = body.preferences.model_dump_json()

    record = await uow.searches.create(body.name, preferences_json)

    # Store preferences in a way the workflow can access
    prefs = json.loads(preferences_json)

    await session.commit()

    return SearchResponse(
        id=record.id,
        name=record.name,
        status="created",
        created_at=record.created_at.isoformat(),
        updated_at=record.updated_at.isoformat(),
        preferences=prefs,
    )


@router.get("", response_model=list[SearchResponse])
async def list_searches(session: AsyncSession = Depends(get_session)):
    uow = UnitOfWork(session)
    records = await uow.searches.list_all()

    return [
        SearchResponse(
            id=r.id,
            name=r.name,
            status=r.status,
            created_at=r.created_at.isoformat(),
            updated_at=r.updated_at.isoformat(),
            preferences=json.loads(r.preferences_json),
        )
        for r in records
    ]


@router.get("/{search_id}", response_model=SearchResponse)
async def get_search(search_id: str, session: AsyncSession = Depends(get_session)):
    uow = UnitOfWork(session)
    record = await uow.searches.get(search_id)
    if not record:
        raise HTTPException(404, "Search not found")

    return SearchResponse(
        id=record.id,
        name=record.name,
        status=record.status,
        created_at=record.created_at.isoformat(),
        updated_at=record.updated_at.isoformat(),
        preferences=json.loads(record.preferences_json),
    )


@router.post("/{search_id}/start", response_model=WorkflowStatusResponse)
async def start_search(search_id: str, session: AsyncSession = Depends(get_session)):
    controller = WorkflowController(session)

    # Create workflow if not exists
    state = await controller.get_workflow_state(search_id)
    if not state:
        state = await controller.create_workflow(search_id)

    # Store preferences in workflow context
    uow = UnitOfWork(session)
    search = await uow.searches.get(search_id)
    if search:
        prefs = json.loads(search.preferences_json)
        # Start with preferences in context
        state = await controller.start_workflow(search_id, initial_data={"preferences": prefs})

        # Return fresh state
        fresh_state = await controller.get_workflow_state(search_id)
        if fresh_state:
            return WorkflowStatusResponse(
                search_id=search_id,
                status=fresh_state.status.value,
                prior_status=fresh_state.prior_status.value if fresh_state.prior_status else None,
                current_step=fresh_state.current_step,
                completed_steps=fresh_state.completed_steps,
                retry_count=fresh_state.retry_count,
                last_error=fresh_state.last_error,
                resumable=fresh_state.resumable,
                created_at=fresh_state.created_at.isoformat(),
                updated_at=fresh_state.updated_at.isoformat(),
            )

    raise HTTPException(500, "Failed to start workflow")


@router.post("/{search_id}/resume", response_model=WorkflowStatusResponse)
async def resume_search(search_id: str, session: AsyncSession = Depends(get_session)):
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
        created_at=state.created_at.isoformat(),
        updated_at=state.updated_at.isoformat(),
    )


@router.post("/{search_id}/reset")
async def reset_search(search_id: str, session: AsyncSession = Depends(get_session)):
    controller = WorkflowController(session)
    await controller.create_workflow(search_id)
    return {"status": "reset", "search_id": search_id}

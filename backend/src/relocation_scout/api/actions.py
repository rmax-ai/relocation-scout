from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.api.models import ActionResponse, ApprovalRequest
from relocation_scout.dependencies import get_session
from relocation_scout.persistence.unit_of_work import UnitOfWork
from relocation_scout.tools.approval_gateway import approval_gateway
from relocation_scout.workflow.controller import WorkflowController

router = APIRouter(tags=["actions"])


@router.get("/api/searches/{search_id}/actions", response_model=list[ActionResponse])
async def list_actions(search_id: str, session: AsyncSession = Depends(get_session)):
    uow = UnitOfWork(session)
    records = await uow.pending_actions.get_by_search(search_id)

    return [
        ActionResponse(
            action_id=r.id,
            action_type=r.action_type,
            target_listing_id=r.target_listing_id,
            payload=json.loads(r.payload_json),
            payload_hash=r.payload_hash,
            idempotency_key=r.idempotency_key,
            risk_level=r.risk_level,
            status=r.status,
            created_at=r.created_at.isoformat(),
        )
        for r in records
    ]


@router.get("/api/actions/{action_id}", response_model=ActionResponse)
async def get_action(action_id: str, session: AsyncSession = Depends(get_session)):
    uow = UnitOfWork(session)
    record = await uow.pending_actions.get(action_id)
    if not record:
        raise HTTPException(404, "Action not found")

    return ActionResponse(
        action_id=record.id,
        action_type=record.action_type,
        target_listing_id=record.target_listing_id,
        payload=json.loads(record.payload_json),
        payload_hash=record.payload_hash,
        idempotency_key=record.idempotency_key,
        risk_level=record.risk_level,
        status=record.status,
        created_at=record.created_at.isoformat(),
    )


@router.patch("/api/actions/{action_id}")
async def edit_action(
    action_id: str,
    body: dict,
    session: AsyncSession = Depends(get_session),
):
    uow = UnitOfWork(session)
    record = await uow.pending_actions.get(action_id)
    if not record:
        raise HTTPException(404, "Action not found")

    new_payload = body.get("payload", json.loads(record.payload_json))
    await approval_gateway.edit_action(record, new_payload)
    await session.commit()

    return ActionResponse(
        action_id=record.id,
        action_type=record.action_type,
        target_listing_id=record.target_listing_id,
        payload=new_payload,
        payload_hash=record.payload_hash,
        idempotency_key=record.idempotency_key,
        risk_level=record.risk_level,
        status="draft",
        created_at=record.created_at.isoformat(),
    )


@router.post("/api/actions/{action_id}/approve")
async def approve_action(
    action_id: str,
    body: ApprovalRequest,
    session: AsyncSession = Depends(get_session),
):
    uow = UnitOfWork(session)
    record = await uow.pending_actions.get(action_id)
    if not record:
        raise HTTPException(404, "Action not found")

    if record.status == "approved":
        raise HTTPException(400, "Action already approved")

    decision = await approval_gateway.approve(session, record, body.approved_by, body.comment)
    await session.commit()

    return {
        "approval_id": decision.approval_id,
        "action_id": action_id,
        "decision": "approved",
        "approved_by": body.approved_by,
        "approved_at": decision.approved_at.isoformat(),
    }


@router.post("/api/actions/{action_id}/reject")
async def reject_action(
    action_id: str,
    body: ApprovalRequest,
    session: AsyncSession = Depends(get_session),
):
    uow = UnitOfWork(session)
    record = await uow.pending_actions.get(action_id)
    if not record:
        raise HTTPException(404, "Action not found")

    decision = await approval_gateway.reject(session, record, body.approved_by, body.comment)
    await session.commit()

    return {
        "approval_id": decision.approval_id,
        "action_id": action_id,
        "decision": "rejected",
        "approved_by": body.approved_by,
    }


@router.post("/api/actions/{action_id}/execute")
async def execute_action(
    action_id: str,
    session: AsyncSession = Depends(get_session),
):
    uow = UnitOfWork(session)
    record = await uow.pending_actions.get(action_id)
    if not record:
        raise HTTPException(404, "Action not found")

    if record.status != "approved":
        raise HTTPException(
            400, f"Action must be approved before execution (current: {record.status})"
        )

    controller = WorkflowController(session)
    try:
        result = await controller.execute_approved_action(record.search_id, action_id)
        return {"status": "executed", "result": result}
    except Exception as e:
        raise HTTPException(500, f"Action execution failed: {e!s}") from e

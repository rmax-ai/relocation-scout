from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.contracts.action import PendingAction
from relocation_scout.contracts.approval import ApprovalDecision
from relocation_scout.persistence.models import (
    ApprovalDecisionRecord,
    PendingActionRecord,
)


def compute_payload_hash(payload: dict) -> str:
    raw = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def compute_idempotency_key(
    action_type: str, listing_id: str, recipient: str, payload_hash: str
) -> str:
    return f"{action_type}:{listing_id}:{recipient}:{payload_hash}"


class ApprovalGateway:
    """Enforces approval rules for external actions."""

    async def create_pending_action(
        self,
        session: AsyncSession,
        search_id: str,
        action_type: str,
        target_listing_id: str,
        payload: dict,
        risk_level: str = "low",
    ) -> PendingAction:
        payload_hash = compute_payload_hash(payload)
        idempotency_key = compute_idempotency_key(
            action_type, target_listing_id, payload.get("recipient", ""), payload_hash
        )

        record = PendingActionRecord(
            id=str(uuid.uuid4()),
            search_id=search_id,
            action_type=action_type,
            target_listing_id=target_listing_id,
            payload_json=json.dumps(payload),
            payload_hash=payload_hash,
            idempotency_key=idempotency_key,
            risk_level=risk_level,
            status="draft",
        )
        session.add(record)
        await session.flush()

        return PendingAction(
            action_id=record.id,
            search_id=search_id,
            action_type=action_type,
            target_listing_id=target_listing_id,
            payload=payload,
            payload_hash=payload_hash,
            idempotency_key=idempotency_key,
            risk_level=risk_level,
            status="draft",
        )

    async def approve(
        self,
        session: AsyncSession,
        action: PendingActionRecord,
        approved_by: str,
        comment: str | None = None,
    ) -> ApprovalDecision:
        decision = ApprovalDecisionRecord(
            id=str(uuid.uuid4()),
            action_id=action.id,
            decision="approved",
            approved_by=approved_by,
            approved_at=datetime.now(),
            comment=comment,
        )
        session.add(decision)

        action.status = "approved"
        action.updated_at = datetime.now()
        await session.flush()

        return ApprovalDecision(
            approval_id=decision.id,
            action_id=action.id,
            decision="approved",
            approved_by=approved_by,
            approved_at=decision.approved_at,
            comment=comment,
        )

    async def reject(
        self,
        session: AsyncSession,
        action: PendingActionRecord,
        approved_by: str,
        comment: str | None = None,
    ) -> ApprovalDecision:
        decision = ApprovalDecisionRecord(
            id=str(uuid.uuid4()),
            action_id=action.id,
            decision="rejected",
            approved_by=approved_by,
            approved_at=datetime.now(),
            comment=comment,
        )
        session.add(decision)

        action.status = "rejected"
        action.updated_at = datetime.now()
        await session.flush()

        return ApprovalDecision(
            approval_id=decision.id,
            action_id=action.id,
            decision="rejected",
            approved_by=approved_by,
            approved_at=decision.approved_at,
            comment=comment,
        )

    async def edit_action(
        self,
        action: PendingActionRecord,
        new_payload: dict,
    ) -> PendingAction:
        """Edit action payload. Changes the hash, invalidating any prior approval."""
        new_hash = compute_payload_hash(new_payload)
        new_idempotency_key = compute_idempotency_key(
            action.action_type,
            action.target_listing_id,
            new_payload.get("recipient", ""),
            new_hash,
        )

        action.payload_json = json.dumps(new_payload)
        action.payload_hash = new_hash
        action.idempotency_key = new_idempotency_key
        action.status = "draft"
        action.updated_at = datetime.now()

        return PendingAction(
            action_id=action.id,
            search_id=action.search_id,
            action_type=action.action_type,
            target_listing_id=action.target_listing_id,
            payload=new_payload,
            payload_hash=new_hash,
            idempotency_key=new_idempotency_key,
            risk_level=action.risk_level,
            status="draft",
        )

    async def verify_approval_valid(
        self,
        session: AsyncSession,
        action: PendingActionRecord,
        current_payload_hash: str,
    ) -> bool:
        """Verify that the approval is still valid for the current payload hash."""
        if action.status != "approved":
            return False
        return action.payload_hash == current_payload_hash


approval_gateway = ApprovalGateway()

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.contracts.audit import ActorType, AuditEvent, AuditEventType
from relocation_scout.persistence.models import AuditEventRecord


class AuditLogger:
    """Central audit event emission."""

    def __init__(self, session: AsyncSession | None = None):
        self.session = session
        self._pending: list[AuditEvent] = []

    def emit(
        self,
        event_type: AuditEventType | str,
        actor: ActorType | str,
        message: str,
        search_id: str | None = None,
        workflow_step: str | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        metadata: dict[str, Any] | None = None,
        trace_id: str | None = None,
    ) -> AuditEvent:
        event = AuditEvent(
            event_id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            event_type=AuditEventType(event_type) if isinstance(event_type, str) else event_type,
            actor=ActorType(actor) if isinstance(actor, str) else actor,
            search_id=search_id,
            workflow_step=workflow_step,
            entity_type=entity_type,
            entity_id=entity_id,
            message=message,
            metadata=metadata or {},
            trace_id=trace_id,
        )
        self._pending.append(event)
        return event

    async def flush(self, session: AsyncSession):
        """Persist all pending events to the database."""
        for event in self._pending:
            record = AuditEventRecord(
                id=event.event_id,
                timestamp=event.timestamp,
                event_type=event.event_type.value
                if isinstance(event.event_type, AuditEventType)
                else event.event_type,
                actor=event.actor.value if isinstance(event.actor, ActorType) else event.actor,
                search_id=event.search_id,
                workflow_step=event.workflow_step,
                entity_type=event.entity_type,
                entity_id=event.entity_id,
                message=event.message,
                metadata_json=json.dumps(event.metadata),
                trace_id=event.trace_id,
            )
            session.add(record)
        self._pending.clear()
        await session.flush()

    @property
    def pending_events(self) -> list[AuditEvent]:
        return list(self._pending)

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class AuditEventType(StrEnum):
    # Workflow events
    WORKFLOW_STARTED = "workflow.started"
    WORKFLOW_STEP_STARTED = "workflow.step.started"
    WORKFLOW_STEP_COMPLETED = "workflow.step.completed"
    WORKFLOW_STEP_FAILED = "workflow.step.failed"
    WORKFLOW_STEP_RETRIED = "workflow.step.retried"
    WORKFLOW_STEP_SKIPPED = "workflow.step.skipped"
    WORKFLOW_COMPLETED = "workflow.completed"
    WORKFLOW_FAILED = "workflow.failed"
    WORKFLOW_RESUMED = "workflow.resumed"
    # Agent events
    AGENT_CALL_STARTED = "agent.call.started"
    AGENT_CALL_COMPLETED = "agent.call.completed"
    AGENT_VALIDATION_FAILED = "agent.validation.failed"
    AGENT_VALIDATION_REPAIRED = "agent.validation.repaired"
    # Action events
    ACTION_CREATED = "action.created"
    ACTION_APPROVED = "action.approved"
    ACTION_REJECTED = "action.rejected"
    ACTION_EDITED = "action.edited"
    ACTION_EXECUTING = "action.executing"
    ACTION_EXECUTED = "action.executed"
    ACTION_FAILED = "action.failed"
    ACTION_DUPLICATE_PREVENTED = "action.duplicate_prevented"
    # Security events
    SECURITY_SUSPICIOUS_CONTENT = "security.suspicious_content"
    SECURITY_INJECTION_DETECTED = "security.injection_detected"
    SECURITY_INVALID_TRANSITION = "security.invalid_transition"
    SECURITY_APPROVAL_BYPASS_ATTEMPT = "security.approval_bypass_attempt"
    # System events
    SYSTEM_ERROR = "system.error"
    SYSTEM_RECOVERY = "system.recovery"


class ActorType(StrEnum):
    SYSTEM = "system"
    DETERMINISTIC = "deterministic"
    AGENT = "agent"
    HUMAN = "human"
    TOOL = "tool"


class AuditEvent(BaseModel):
    event_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    event_type: AuditEventType
    actor: ActorType
    search_id: str | None = None
    workflow_step: str | None = None
    entity_type: str | None = None
    entity_id: str | None = None
    message: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    trace_id: str | None = None

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class WorkflowStatus(StrEnum):
    CREATED = "created"
    LISTINGS_FETCHED = "listings_fetched"
    LISTINGS_NORMALIZED = "listings_normalized"
    LISTINGS_DEDUPLICATED = "listings_deduplicated"
    ENRICHMENT_RUNNING = "enrichment_running"
    ENRICHMENT_COMPLETE = "enrichment_complete"
    RANKING_COMPLETE = "ranking_complete"
    SHORTLIST_CREATED = "shortlist_created"
    AWAITING_APPROVAL = "awaiting_approval"
    ACTION_EXECUTED = "action_executed"
    COMPLETED = "completed"
    FAILED = "failed"


class WorkflowState(BaseModel):
    search_id: str
    status: WorkflowStatus
    prior_status: WorkflowStatus | None = None
    current_step: str | None = None
    completed_steps: list[str] = Field(default_factory=list)
    retry_count: int = 0
    last_error: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())
    resumable: bool = True


class WorkflowContext(BaseModel):
    search_id: str
    state: WorkflowState
    data: dict[str, Any] = Field(default_factory=dict)


class StepResult(BaseModel):
    step_name: str
    success: bool
    output: dict[str, Any] = Field(default_factory=dict)
    error: str | None = None
    should_retry: bool = False
    audit_events: list[dict[str, Any]] = Field(default_factory=list)

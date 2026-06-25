from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

ActionType = Literal["send_realtor_email", "create_viewing_request"]
ActionStatus = Literal[
    "draft",
    "pending_approval",
    "approved",
    "rejected",
    "executing",
    "completed",
    "failed",
]


class PendingAction(BaseModel):
    action_id: str
    search_id: str
    action_type: ActionType
    target_listing_id: str
    payload: dict[str, Any]
    payload_hash: str
    idempotency_key: str
    risk_level: Literal["low", "medium", "high"] = "low"
    status: ActionStatus = "draft"
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())


class CompletedAction(BaseModel):
    action_id: str
    idempotency_key: str
    status: Literal["completed", "failed"]
    result: dict[str, Any] = Field(default_factory=dict)
    completed_at: datetime = Field(default_factory=lambda: datetime.now())

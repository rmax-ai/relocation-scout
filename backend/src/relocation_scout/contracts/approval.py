from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ApprovalDecision(BaseModel):
    approval_id: str
    action_id: str
    decision: Literal["approved", "rejected"]
    approved_by: str
    approved_at: datetime = Field(default_factory=lambda: datetime.now())
    edited_payload: dict[str, Any] | None = None
    comment: str | None = None

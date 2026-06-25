from __future__ import annotations

from pydantic import BaseModel

from relocation_scout.contracts.preferences import HousingPreferences


class SearchCreateRequest(BaseModel):
    name: str
    preferences: HousingPreferences


class SearchResponse(BaseModel):
    id: str
    name: str
    status: str
    created_at: str
    updated_at: str
    preferences: dict = {}


class WorkflowStatusResponse(BaseModel):
    search_id: str
    status: str
    prior_status: str | None = None
    current_step: str | None = None
    completed_steps: list[str] = []
    retry_count: int = 0
    last_error: str | None = None
    resumable: bool = True
    created_at: str | None = None
    updated_at: str | None = None


class ListingResponse(BaseModel):
    listing_id: str
    provider: str
    title: str
    address: str
    neighbourhood: str
    monthly_rent_eur: int
    bedrooms: int
    area_m2: float | None = None
    commute_minutes: float | None = None
    overall_score: float | None = None
    recommendation: str | None = None
    is_suspicious: bool = False
    hard_constraints_passed: bool | None = None


class ActionResponse(BaseModel):
    action_id: str
    action_type: str
    target_listing_id: str
    payload: dict
    payload_hash: str
    idempotency_key: str
    risk_level: str
    status: str
    created_at: str | None = None


class ApprovalRequest(BaseModel):
    approved_by: str = "demo_user"
    comment: str | None = None

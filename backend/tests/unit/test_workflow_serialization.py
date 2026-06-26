from __future__ import annotations

import json

import pytest

from relocation_scout.config import settings
from relocation_scout.contracts.workflow import WorkflowContext, WorkflowState, WorkflowStatus
from relocation_scout.observability.events import AuditLogger
from relocation_scout.workflow.steps import WorkflowSteps


@pytest.mark.asyncio
async def test_normalized_listings_remain_json_serializable_after_dedup(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "agent_runtime", "mock")
    steps = WorkflowSteps(AuditLogger())
    ctx = WorkflowContext(
        search_id="search-1",
        state=WorkflowState(search_id="search-1", status=WorkflowStatus.CREATED),
        data={
            "preferences": {
                "max_monthly_rent_eur": 2500,
                "minimum_bedrooms": 2,
                "minimum_area_m2": 60,
                "max_commute_minutes": 45,
                "destination_address": "Amsterdam Centraal",
                "preferred_neighbourhoods": ["West", "Oost"],
                "excluded_neighbourhoods": [],
                "priorities": {
                    "quiet": 0.25,
                    "transport": 0.25,
                    "green_space": 0.25,
                    "affordability": 0.25,
                },
            },
            "raw_listings": [
                {
                    "id": "funda-001",
                    "title": "Test Apt",
                    "address": "Test St 1",
                    "neighbourhood": "West",
                    "monthly_rent_eur": 1500,
                    "bedrooms": 2,
                    "area_m2": 75.0,
                    "source_url": "http://example.com",
                    "description": "A lovely apartment",
                    "_provider": "funda",
                }
            ],
        },
    )

    await steps.normalize_listings(ctx)
    await steps.deduplicate_listings(ctx)

    listing = ctx.data["normalized_listings"][0]
    assert isinstance(listing["fetched_at"], str)
    json.dumps(ctx.data["normalized_listings"])

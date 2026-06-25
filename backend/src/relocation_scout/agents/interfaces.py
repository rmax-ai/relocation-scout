from __future__ import annotations

from typing import Any, Protocol, runtime_checkable

from relocation_scout.contracts.research import NeighbourhoodAssessment


@runtime_checkable
class AgentInterface(Protocol):
    """Protocol for all agents. Framework-specific implementations conform to this."""

    async def research_neighbourhood(
        self,
        neighbourhood: str,
        fixture_evidence: dict | None,
        preferences_context: dict,
    ) -> NeighbourhoodAssessment: ...

    async def evaluate_qualitative_fit(
        self,
        listing_data: dict,
        deterministic_scores: dict,
        neighbourhood_assessment: dict | None,
        preferences_context: dict,
    ) -> dict[str, Any]: ...

    async def synthesize_shortlist(
        self,
        top_listings: list[dict],
        search_context: dict,
    ) -> dict[str, Any]: ...

    async def draft_realtor_message(
        self,
        listing_data: dict,
        user_intent: str,
        template_context: dict,
    ) -> dict[str, Any]: ...

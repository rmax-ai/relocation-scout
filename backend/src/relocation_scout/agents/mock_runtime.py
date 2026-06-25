from __future__ import annotations

from typing import Any

from relocation_scout.contracts.research import (
    EvidenceItem,
    NeighbourhoodAssessment,
)


class MockAgentRuntime:
    """
    Deterministic mock agent runtime.
    Returns canned responses for CI/demo mode. No API key required.
    """

    def __init__(self, fail_next: bool = False, return_malformed: bool = False):
        self.fail_next = fail_next
        self.return_malformed = return_malformed
        self.call_count = 0

    async def research_neighbourhood(
        self,
        neighbourhood: str,
        fixture_evidence: dict | None,
        preferences_context: dict,
    ) -> NeighbourhoodAssessment:
        self.call_count += 1

        if self.fail_next:
            self.fail_next = False
            raise RuntimeError("Simulated agent failure")

        if self.return_malformed:
            self.return_malformed = False
            return {"not": "a valid assessment"}  # type: ignore

        # Generate assessment from fixture data if available
        nb_lower = neighbourhood.lower().strip()
        fixture = fixture_evidence or {}

        quiet = fixture.get("quiet_score", 0.6)
        transport = fixture.get("transport_score", 0.5)
        green = fixture.get("green_space_score", 0.5)
        summary = fixture.get("summary", f"{neighbourhood} is a residential area in Amsterdam.")
        strengths = fixture.get("strengths", ["Good location"])
        concerns = fixture.get("concerns", ["Can be busy"])

        evidence = [
            EvidenceItem(
                source_type="fixture",
                source_id=f"nbh-{nb_lower.replace(' ', '-')}",
                claim=f"Quiet score for {neighbourhood}",
                value=quiet,
                confidence=0.85,
            ),
            EvidenceItem(
                source_type="fixture",
                source_id=f"nbh-{nb_lower.replace(' ', '-')}",
                claim=f"Transport score for {neighbourhood}",
                value=transport,
                confidence=0.85,
            ),
            EvidenceItem(
                source_type="fixture",
                source_id=f"nbh-{nb_lower.replace(' ', '-')}",
                claim=f"Green space score for {neighbourhood}",
                value=green,
                confidence=0.80,
            ),
        ]

        return NeighbourhoodAssessment(
            neighbourhood=neighbourhood,
            quiet_score=quiet,
            transport_score=transport,
            green_space_score=green,
            summary=summary,
            strengths=strengths,
            concerns=concerns,
            evidence=evidence,
        )

    async def evaluate_qualitative_fit(
        self,
        listing_data: dict,
        deterministic_scores: dict,
        neighbourhood_assessment: dict | None,
        preferences_context: dict,
    ) -> dict[str, Any]:
        self.call_count += 1

        if self.fail_next:
            self.fail_next = False
            raise RuntimeError("Simulated agent failure")

        nb = neighbourhood_assessment or {}
        listing_id = listing_data.get("listing_id", "unknown")

        # Deterministic mock: qualitative score based on neighbourhood + preferences
        nb_avg = (
            nb.get("quiet_score", 0.5)
            + nb.get("transport_score", 0.5)
            + nb.get("green_space_score", 0.5)
        ) / 3
        qualitative_score = round(nb_avg * 0.7 + 0.3, 3)

        return {
            "listing_id": listing_id,
            "qualitative_fit_score": qualitative_score,
            "strengths": [
                f"Neighbourhood {nb.get('neighbourhood', 'area')} matches lifestyle preferences",
            ],
            "concerns": [],
            "explanation": f"Based on neighbourhood assessment: {nb.get('summary', 'Standard residential area')}. The area scores well on the user's priority dimensions.",
            "evidence_ids": [f"nbh-{nb.get('neighbourhood', 'unknown').lower().replace(' ', '-')}"],
        }

    async def synthesize_shortlist(
        self,
        top_listings: list[dict],
        search_context: dict,
    ) -> dict[str, Any]:
        self.call_count += 1

        if not top_listings:
            return {"summary": "No suitable listings found.", "comparison_notes": ""}

        top = top_listings[0]
        return {
            "summary": f"Top recommendation: {top.get('title', 'listing')} in {top.get('neighbourhood', 'the area')}. "
            f"This property offers the best balance of affordability, commute time, and neighbourhood quality.",
            "comparison_notes": f"Compared {len(top_listings)} listings. "
            f"The top pick stands out for its overall score of {top.get('overall_score', 'N/A')}.",
        }

    async def draft_realtor_message(
        self,
        listing_data: dict,
        user_intent: str,
        template_context: dict,
    ) -> dict[str, Any]:
        self.call_count += 1

        title = listing_data.get("title", "the property")
        address = listing_data.get("address", "")
        rent = listing_data.get("monthly_rent_eur", "N/A")

        return {
            "subject": f"Inquiry about {title} — {address}",
            "body": (
                f"Dear agent,\n\n"
                f"I am interested in {title} at {address} (€{rent}/month).\n\n"
                f"{user_intent}\n\n"
                f"I would like to schedule a viewing at your earliest convenience.\n\n"
                f"Best regards"
            ),
        }

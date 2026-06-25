from __future__ import annotations

from relocation_scout.contracts.listing import NormalizedListing
from relocation_scout.contracts.preferences import HousingPreferences
from relocation_scout.contracts.ranking import ListingEvaluation, RecommendationLevel
from relocation_scout.contracts.research import CommuteResult, NeighbourhoodAssessment


def calculate_deterministic_scores(
    listing: NormalizedListing,
    preferences: HousingPreferences,
    commute: CommuteResult,
    neighbourhood: NeighbourhoodAssessment | None,
    hard_constraints_passed: bool,
) -> ListingEvaluation:
    """Calculate deterministic numeric scores for a listing."""

    if not hard_constraints_passed:
        return ListingEvaluation(
            listing_id=listing.listing_id,
            hard_constraints_passed=False,
            affordability_score=0.0,
            commute_score=0.0,
            neighbourhood_score=0.0,
            qualitative_fit_score=0.0,
            overall_score=0.0,
            strengths=[],
            concerns=["Hard constraints not met"],
            recommendation="reject",
            evidence_ids=[],
        )

    # Affordability: lower rent = higher score
    max_rent = max(preferences.max_monthly_rent_eur, 1)
    affordability_score = 1.0 - (listing.monthly_rent_eur / max_rent)
    affordability_score = max(0.0, min(1.0, affordability_score))

    # Commute: shorter = higher score
    max_commute = max(preferences.max_commute_minutes, 1)
    commute_score = 1.0 - (commute.duration_minutes / max_commute)
    commute_score = max(0.0, min(1.0, commute_score))

    # Neighbourhood: aggregate from assessment
    if neighbourhood:
        neighbourhood_score = (
            neighbourhood.quiet_score * preferences.priorities.quiet
            + neighbourhood.transport_score * preferences.priorities.transport
            + neighbourhood.green_space_score * preferences.priorities.green_space
        )
    else:
        neighbourhood_score = 0.5

    # Overall score: weighted combination
    overall_score = (
        affordability_score * preferences.priorities.affordability
        + commute_score * preferences.priorities.transport
        + neighbourhood_score * (1.0 - preferences.priorities.affordability)
    ) * 0.5  # Reserve 0.5 weight for qualitative assessment

    strengths, concerns = _assess_strengths_concerns(
        listing, commute, neighbourhood, affordability_score, commute_score
    )

    recommendation = _determine_recommendation(overall_score)

    return ListingEvaluation(
        listing_id=listing.listing_id,
        hard_constraints_passed=True,
        affordability_score=round(affordability_score, 3),
        commute_score=round(commute_score, 3),
        neighbourhood_score=round(neighbourhood_score, 3),
        qualitative_fit_score=0.0,  # Will be filled by agent
        overall_score=round(overall_score, 3),
        strengths=strengths,
        concerns=concerns,
        recommendation=recommendation,
        evidence_ids=[],
        is_qualitative=False,
    )


def _assess_strengths_concerns(
    listing: NormalizedListing,
    commute: CommuteResult,
    neighbourhood: NeighbourhoodAssessment | None,
    affordability_score: float,
    commute_score: float,
) -> tuple[list[str], list[str]]:
    strengths: list[str] = []
    concerns: list[str] = []

    if affordability_score > 0.7:
        strengths.append(f"Well under budget at €{listing.monthly_rent_eur}/month")
    elif affordability_score < 0.3:
        concerns.append(f"Near top of budget at €{listing.monthly_rent_eur}/month")

    if commute_score > 0.7:
        strengths.append(f"Good commute: {commute.duration_minutes}min")
    elif commute_score < 0.3:
        concerns.append(f"Long commute: {commute.duration_minutes}min")

    if neighbourhood:
        if neighbourhood.quiet_score > 0.7:
            strengths.append(f"Quiet neighbourhood: {neighbourhood.neighbourhood}")
        if neighbourhood.green_space_score < 0.3:
            concerns.append(f"Limited green space in {neighbourhood.neighbourhood}")

    return strengths, concerns


def _determine_recommendation(overall_score: float) -> RecommendationLevel:
    if overall_score >= 0.6:
        return "strong_match"
    elif overall_score >= 0.4:
        return "possible_match"
    elif overall_score >= 0.2:
        return "weak_match"
    else:
        return "reject"

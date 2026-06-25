from __future__ import annotations

from relocation_scout.contracts.listing import NormalizedListing
from relocation_scout.contracts.preferences import HousingPreferences
from relocation_scout.contracts.research import CommuteResult


def check_hard_constraints(
    listing: NormalizedListing,
    preferences: HousingPreferences,
    commute: CommuteResult | None = None,
) -> tuple[bool, list[str]]:
    """Check if a listing passes all hard constraints."""
    failures: list[str] = []

    if listing.monthly_rent_eur > preferences.max_monthly_rent_eur:
        failures.append(
            f"Rent €{listing.monthly_rent_eur} exceeds max €{preferences.max_monthly_rent_eur}"
        )

    if listing.bedrooms < preferences.minimum_bedrooms:
        failures.append(f"Bedrooms {listing.bedrooms} below minimum {preferences.minimum_bedrooms}")

    if preferences.minimum_area_m2 and listing.area_m2:
        if listing.area_m2 < preferences.minimum_area_m2:
            failures.append(
                f"Area {listing.area_m2}m² below minimum {preferences.minimum_area_m2}m²"
            )

    if commute and commute.duration_minutes > preferences.max_commute_minutes:
        failures.append(
            f"Commute {commute.duration_minutes}min exceeds max {preferences.max_commute_minutes}min"
        )

    if preferences.excluded_neighbourhoods:
        listing_nb = listing.neighbourhood.lower().strip()
        excluded = [e.lower().strip() for e in preferences.excluded_neighbourhoods]
        if listing_nb in excluded:
            failures.append(f"Neighbourhood {listing.neighbourhood} is excluded")

    return len(failures) == 0, failures

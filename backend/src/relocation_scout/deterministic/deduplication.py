from __future__ import annotations

from relocation_scout.contracts.listing import NormalizedListing


def deduplicate_listings(listings: list[NormalizedListing]) -> list[NormalizedListing]:
    """
    Deduplicate listings across providers.
    Strategy: same address + same monthly_rent_eur → duplicate.
    First occurrence wins.
    """
    seen: dict[tuple[str, int], NormalizedListing] = {}
    result: list[NormalizedListing] = []

    for listing in listings:
        key = (listing.address.lower().strip(), listing.monthly_rent_eur)
        if key in seen:
            continue
        seen[key] = listing
        result.append(listing)

    return result

from __future__ import annotations

from relocation_scout.contracts.listing import NormalizedListing
from relocation_scout.contracts.research import CommuteResult

# Mock commute data: distances from Amsterdam neighbourhoods to a central destination
_MOCK_COMMUTES: dict[str, tuple[float, float]] = {
    "west": (18.0, 5.2),
    "de baarsjes": (22.0, 6.1),
    "oud-west": (15.0, 4.3),
    "zuid": (25.0, 7.8),
    "oost": (28.0, 8.5),
    "noord": (35.0, 10.2),
    "rivierenbuurt": (20.0, 6.0),
    "bos en lommer": (24.0, 7.0),
    "centrum": (12.0, 3.5),
    "de pijp": (16.0, 4.8),
    "jordaan": (14.0, 4.0),
    "westerpark": (19.0, 5.5),
}


def calculate_commute(
    listing: NormalizedListing,
    destination_address: str,
) -> CommuteResult:
    """Calculate commute time using mocked maps service."""
    neighbourhood_key = listing.neighbourhood.lower().strip()
    duration, distance = _MOCK_COMMUTES.get(neighbourhood_key, (30.0, 9.0))

    # Add small variation based on listing address hash
    address_hash = hash(listing.address) % 100
    variation = (address_hash - 50) * 0.04
    duration = max(5.0, min(60.0, duration + variation))
    distance = max(1.0, min(20.0, distance + variation * 0.3))

    return CommuteResult(
        listing_id=listing.listing_id,
        destination_address=destination_address,
        duration_minutes=round(duration, 1),
        distance_km=round(distance, 1),
        transport_mode="transit",
    )

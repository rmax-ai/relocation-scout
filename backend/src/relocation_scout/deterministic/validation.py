from __future__ import annotations

from relocation_scout.contracts.listing import NormalizedListing


def validate_listing(listing: NormalizedListing) -> list[str]:
    """Validate a normalized listing has all required fields. Returns list of issues."""
    issues: list[str] = []

    if not listing.listing_id:
        issues.append("Missing listing_id")
    if not listing.title:
        issues.append("Missing title")
    if not listing.address:
        issues.append("Missing address")
    if listing.monthly_rent_eur <= 0:
        issues.append(f"Invalid rent: {listing.monthly_rent_eur}")
    if listing.bedrooms < 0:
        issues.append(f"Invalid bedrooms: {listing.bedrooms}")
    if not listing.source_url:
        issues.append("Missing source_url")

    return issues

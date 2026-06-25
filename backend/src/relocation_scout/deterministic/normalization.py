from __future__ import annotations

import hashlib
import json

from relocation_scout.contracts.listing import NormalizedListing
from relocation_scout.security.untrusted_input import wrap_untrusted_content


def _hash_payload(payload: dict) -> str:
    raw = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def normalize_listing(raw: dict, provider: str) -> NormalizedListing:
    """Normalize a raw listing from any provider into the standard schema."""
    provider_listing_id = str(raw.get("id", raw.get("listing_id", "")))

    normalized = NormalizedListing(
        listing_id=f"{provider}:{provider_listing_id}",
        provider=provider,
        provider_listing_id=provider_listing_id,
        title=str(raw.get("title", "")),
        address=str(raw.get("address", "")),
        neighbourhood=str(raw.get("neighbourhood", raw.get("wijk", ""))),
        monthly_rent_eur=int(raw.get("monthly_rent_eur", raw.get("prijs", 0))),
        bedrooms=int(raw.get("bedrooms", raw.get("slaapkamers", 0))),
        area_m2=float(raw["area_m2"]) if raw.get("area_m2") else None,
        source_url=str(raw.get("source_url", raw.get("url", ""))),
        description=str(raw.get("description", raw.get("beschrijving", ""))),
        source_payload_hash=_hash_payload(raw),
    )

    # Apply untrusted content wrapping and check for suspicious content
    wrapped = wrap_untrusted_content(
        source_id=normalized.listing_id,
        content=normalized.description,
    )
    normalized.description = wrapped.content
    normalized.is_suspicious = wrapped.is_suspicious
    normalized.suspicion_reasons = wrapped.risk_indicators

    return normalized

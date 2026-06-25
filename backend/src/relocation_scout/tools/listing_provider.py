from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).parent.parent.parent.parent.parent / "data"


async def fetch_listings_from_providers() -> list[dict[str, Any]]:
    """Fetch raw listings from all configured mock providers."""
    all_listings: list[dict[str, Any]] = []

    # Load from JSON fixture
    fixture_path = DATA_DIR / "listings_amsterdam.json"
    if fixture_path.exists():
        with open(fixture_path) as f:
            data = json.load(f)
            if isinstance(data, list):
                all_listings.extend(data)
            elif isinstance(data, dict):
                for provider, listings in data.items():
                    for listing in listings:
                        listing["_provider"] = provider
                    all_listings.extend(listings)

    return all_listings

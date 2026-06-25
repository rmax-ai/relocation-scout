from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent.parent.parent / "data"


async def get_neighbourhood_facts(neighbourhood: str) -> dict | None:
    """Get fixture data for a neighbourhood."""
    fixture_path = DATA_DIR / "neighbourhood_facts.json"
    if not fixture_path.exists():
        return None

    with open(fixture_path) as f:
        data = json.load(f)

    neighbourhood_key = neighbourhood.lower().strip()
    for key, facts in data.items():
        if key.lower().strip() == neighbourhood_key:
            return facts

    return None

from __future__ import annotations

from typing import ClassVar

from relocation_scout.tools.listing_provider import fetch_listings_from_providers
from relocation_scout.tools.maps import get_neighbourhood_facts


class ToolRegistry:
    """Central tool registry. Agents get read-only tools only."""

    # Tools available to agents (read-only, no side effects)
    AGENT_TOOLS: ClassVar = {
        "get_neighbourhood_facts": get_neighbourhood_facts,
    }

    # Tools available only to the workflow controller
    CONTROLLER_TOOLS: ClassVar = {
        "fetch_listings": fetch_listings_from_providers,
        "get_neighbourhood_facts": get_neighbourhood_facts,
    }

    # External side-effect tools (only through the approval gateway)
    # These are NOT in any agent's tool set
    SIDE_EFFECT_TOOLS: ClassVar = {
        "send_email",  # Only accessible via approval gateway + action executor
    }


tool_registry = ToolRegistry()

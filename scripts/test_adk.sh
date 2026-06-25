#!/usr/bin/env bash
set -euo pipefail

# Get the API key
KEY=$(PA...tore pass hermes/gemini/api-key 2>/dev/null)
export GOOGLE_API_KEY="$KEY"
export AGENT_RUNTIME=adk
export VIRTUAL_ENV=
export PYTHONPATH=backend/src

cd ~/src/relocation-scout

.venv/bin/python3 << 'PYEOF'
import asyncio
from relocation_scout.agents.adk_runtime import ADKAgentRuntime

async def main():
    rt = ADKAgentRuntime()
    print("ADK runtime initialized ✓")

    fixture = {
        "quiet_score": 0.65, "transport_score": 0.80, "green_space_score": 0.60,
        "summary": "Amsterdam West is a diverse residential area.",
        "strengths": ["Close to parks", "Good transport"],
        "concerns": ["Can be busy"]
    }

    print("Calling neighbourhood researcher for Amsterdam West...")
    a = await rt.research_neighbourhood(
        "Amsterdam West", fixture,
        {"priorities": {"quiet": 0.4, "transport": 0.3, "green_space": 0.3}}
    )
    print(f"  scores: quiet={a.quiet_score} transport={a.transport_score} green={a.green_space_score}")
    print(f"  summary: {a.summary[:150]}")
    print(f"  strengths: {len(a.strengths)}, concerns: {len(a.concerns)}, evidence: {len(a.evidence)}")

    print()
    print("Drafting realtor message...")
    d = await rt.draft_realtor_message(
        {"title": "Bright 2BR in West", "address": "Jan van Galenstraat 178",
         "neighbourhood": "West", "monthly_rent_eur": 1500},
        "Interested in viewing this property. Would like to know availability.",
        {}
    )
    print(f"  subject: {d['subject']}")
    print(f"  body: {d['body'][:200]}")

    print(f"\nAgent calls: {rt.call_count}")
    print("✓ ADK + Gemini 2.5 Flash live mode works")

asyncio.run(main())
PYEOF

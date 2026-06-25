# ADR 004: Agent Framework Isolation

**Status:** Accepted

**Date:** 2026-06-25

## Context

The project spec requires Google ADK for the agent layer but also mandates mock mode for CI/demos without API keys. The design must allow future migration away from ADK without rewriting agent logic.

## Decision

Isolate the agent framework behind a Python Protocol interface (`AgentInterface`) with two implementations:
1. **MockAgentRuntime** — deterministic canned responses, no API calls
2. **ADKAgentRuntime** — Google ADK with Gemini (optional, not yet implemented)

Agent implementations (neighbourhood researcher, qualitative ranker, etc.) call the runtime interface, not the framework directly.

## Rationale

- **Testability:** Mock runtime enables CI without API keys or network
- **Portability:** Switching frameworks requires only a new runtime implementation
- **Simplicity:** The Protocol defines exactly 4 methods — no abstraction leakage
- **Demo-first:** Mock mode was built first and works end-to-end

## Consequences

- **Positive:** Every agent path is testable with deterministic outputs
- **Positive:** Future ADK migration is contained to `adk_runtime.py`
- **Positive:** Mock runtime supports configurable failure injection for testing
- **Negative:** Protocol may need expansion for frameworks with different capabilities
- **Negative:** ADK runtime not yet implemented (PoC priority: mock mode)

## Implementation Note

The ADK runtime stub exists at `agents/adk_runtime.py` (placeholder). When live mode is needed:
1. Implement `ADKAgentRuntime` conforming to `AgentInterface`
2. Configure `AGENT_RUNTIME=adk` and `GOOGLE_API_KEY` in `.env`
3. Update `workflow/steps.py` to instantiate the configured runtime

# ADR 002: Explicit Workflow Controller

**Status:** Accepted

**Date:** 2026-06-25

## Context

Agentic systems often let the LLM choose workflow transitions (ReAct, function-calling loops). This makes state unpredictable and un-auditable. Relocation Scout must demonstrate a governed alternative.

## Decision

Implement an explicit deterministic workflow controller — a conventional state machine that:
1. Defines all valid state transitions as an enum-based map
2. Rejects invalid transitions at the code level
3. Persists state before and after every step
4. Supports retries with per-step policies
5. Resumes from the last safe checkpoint after failures

## Rationale

- **Determinism:** The LLM never chooses "what happens next" — the controller does
- **Auditability:** Every transition is logged with actor type, timestamp, and metadata
- **Resumability:** Durable checkpoints enable crash recovery
- **Testability:** State machine behavior is fully testable without any LLM calls
- **Governance:** The approval gateway plugs into the controller, not the agent

## Alternatives Considered

- **LLM-driven orchestration (ReAct):** Rejected — unpredictable, un-auditable, bypasses governance
- **LangGraph:** Rejected — adds framework dependency; same determinism achievable with simpler code

## Consequences

- **Positive:** Complete predictability of workflow behavior
- **Positive:** Easy to add new steps (register in transitions + step implementation)
- **Negative:** Less flexible for dynamic workflows — but this is the intent

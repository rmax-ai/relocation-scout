# Relocation Scout — Architecture

## Executive Summary

Relocation Scout is a production-oriented agentic systems proof-of-concept that demonstrates the correct decomposition of a real-world AI workflow. The core thesis: **use code for determinism, agents for judgment, and humans for authority.** The system is not a chat wrapper — it is a governed workflow engine where LLM agents are narrowly-scoped components operating inside explicit boundaries, validated by structured contracts, and monitored by a comprehensive audit trail.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Web UI (React)                        │
│  Searches | Workflow Viz | Listings | Approvals | Audit Log  │
└──────────────────────────┬───────────────────────────────────┘
                           │ REST API (FastAPI)
┌──────────────────────────▼───────────────────────────────────┐
│                    API Layer                                  │
│  searches | listings | workflow | approvals | actions | audit│
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│              Workflow Controller (Deterministic)              │
│  State Machine | Step Orchestrator | Recovery | Retries      │
└──────┬──────────────┬──────────────┬─────────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────────────┐
│Deterministic│ │  Agent     │ │  Approval Gateway │
│  Pipeline   │ │  Layer     │ │  + Action Executor│
│normalization│ │interfaces  │ │  idempotency keys │
│deduplication│ │mock runtime│ │  payload hashing  │
│commute calc │ │ADK runtime │ │  audit events     │
│filtering    │ │validation  │ │  email mock       │
│scoring      │ │injection   │ └───────────────────┘
└──────┬──────┘ │  defense   │
       │        └─────┬──────┘
┌──────▼──────────────▼───────────────────────────────────────┐
│                     Persistence Layer                        │
│  SQLAlchemy 2 | SQLite | Alembic | Repositories | UoW       │
│  searches | listings | evaluations | actions | audit_events │
└──────────────────────────────────────────────────────────────┘
```

## Three-Plane Separation

### Plane 1: Deterministic Code
Conventional code handles all operations where correctness is binary:
- Listing normalization and validation
- Duplicate detection and removal
- Commute time calculation
- Hard constraint filtering (rent, bedrooms, commute)
- Numeric scoring and weight application
- Workflow state transitions
- Approval enforcement
- Idempotency key computation
- Persistence
- Retry logic
- Action execution
- Authorization
- Audit logging

### Plane 2: Agentic Judgment
LLM agents handle tasks requiring interpretation:
- Neighbourhood quality assessment (evidence synthesis)
- Qualitative ranking (preference interpretation)
- Shortlist narrative generation
- Realtor message drafting

Agents are firewalled: no tool access to external systems, no workflow state mutation, no action execution. Outputs are schema-validated before entering the deterministic pipeline.

### Plane 3: Human Authority
Humans retain final decision authority for any external side effect:
- Approving or rejecting realtor messages
- Editing message content before approval
- Confirming viewing requests

The approval gateway is a hard gate in the deterministic code path — no agent can bypass it.

## Component Architecture

### Workflow Controller
An explicit deterministic state machine that:
- Defines allowed state transitions as an enum
- Persists state before and after every step
- Rejects invalid transitions
- Supports retry with configurable policies
- Resumes from the last safe checkpoint
- Skips already-completed idempotent steps
- Publishes audit events on every transition

### Agent Runtime
Framework-abstracted behind interfaces:
```
AgentInterface (Protocol)
  ├── MockAgentRuntime — deterministic canned responses, no API key
  └── ADKAgentRuntime — Google ADK, Gemini models
```

Each agent is a standalone function/class with typed input/output contracts. The runtime handles model invocation, schema parsing, validation, and repair.

### Approval Gateway
Enforces the rule: **no side effect without human approval.**
- All external actions begin as drafts
- Approval binds to a specific payload hash
- Modifying an approved payload invalidates the approval
- Rejected actions cannot execute
- Every decision is timestamped and audited

### Action Executor
Idempotent execution of approved external actions:
1. Load approved action
2. Verify approval exists and payload hash matches
3. Compute idempotency key
4. Check completed-actions store
5. If already completed, return stored result
6. Mark executing
7. Invoke tool (e.g., mock email)
8. Persist result atomically
9. Emit audit event

## Request Lifecycle

```
User creates search → Preferences persisted
  → Workflow starts → fetch_listings
  → normalize_listings (CODE)
  → deduplicate_listings (CODE)
  → calculate_commutes (CODE)
  → research_neighbourhoods (AGENT, parallel)
  → calculate_deterministic_scores (CODE)
  → generate_qualitative_evaluations (AGENT, parallel)
  → build_shortlist (CODE + AGENT synthesis)
  → draft_realtor_message (AGENT)
  → create_pending_action (CODE)
  → await_human_approval (HUMAN)
  → execute_approved_action (CODE)
  → finalize_workflow (CODE)
```

## Trust Boundaries

| # | Boundary | What It Protects |
|---|----------|-----------------|
| T1 | Untrusted listing content → Deterministic pipeline | Prevents injection from reaching agent instructions |
| T2 | Agent output → Workflow state | Schema validation prevents malformed data |
| T3 | Agent → External tools | No tool access; agents cannot invoke email or external services |
| T4 | Draft action → Execution | Approval gateway prevents unauthorized execution |
| T5 | Approved payload → Execution | Payload hash binding prevents tampering |
| T6 | UI → Backend | API authentication and authorization (scope: demo, explicit in future) |

## Data Flow

All inter-component communication uses typed Pydantic contracts. Free-form text never crosses component boundaries without a schema wrapper. Agent outputs are always parsed into typed models before downstream consumption.

## Key Design Decisions

1. **Explicit workflow controller over LLM-driven orchestration** — determinism and auditability require code-defined transitions
2. **SQLite for local development** — zero-config, full SQL feature set, trivially swap to PostgreSQL
3. **Agent framework isolation behind interfaces** — prevents vendor lock-in; mock runtime enables CI without API keys
4. **Payload hash binding for approvals** — cryptographic guarantee that what was approved is what executes
5. **Idempotency keys on all external actions** — enables safe retry and crash recovery
6. **Mock-mode-first agent design** — every agent path is testable without live models

## Trade-offs

| Decision | Trade-off |
|----------|-----------|
| SQLite over PostgreSQL | Simpler local setup; loses concurrent-writer scalability |
| Monolithic backend over microservices | Simpler for PoC; harder to scale independently |
| Mock runtime canned responses | Fast, deterministic; misses real LLM edge cases |
| Synchronous approval step | Blocks workflow; required for governance |
| Agent per-task over single agent | More calls; better separation and auditability |

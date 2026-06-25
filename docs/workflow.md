# Workflow Engine

The Relocation Scout workflow engine is a **deterministic state machine** — the LLM never chooses workflow transitions.

## State Machine

```
CREATED → LISTINGS_FETCHED → LISTINGS_NORMALIZED → LISTINGS_DEDUPLICATED
   ↓
ENRICHMENT_RUNNING → ENRICHMENT_COMPLETE → RANKING_COMPLETE
   ↓
SHORTLIST_CREATED → AWAITING_APPROVAL → ACTION_EXECUTED → COMPLETED

Any state → FAILED
FAILED → (resume from last good state)
```

## Workflow Steps

| Step | Actor | Description |
|------|-------|-------------|
| `fetch_listings` | CODE | Load raw listings from mock providers |
| `normalize_listings` | CODE | Normalize to standard schema, scan for suspicious content |
| `deduplicate_listings` | CODE | Remove cross-provider duplicates by address + rent |
| `calculate_commutes` | CODE | Mock maps service, parallel execution |
| `research_neighbourhoods` | AGENT | LLM-based neighbourhood assessment, parallel per neighbourhood |
| `calculate_deterministic_scores` | CODE | Compute affordability, commute, neighbourhood scores |
| `generate_qualitative_evaluations` | AGENT | LLM-based qualitative fit assessment |
| `build_shortlist` | CODE + AGENT | Score aggregation + agent synthesis |
| `draft_realtor_message` | AGENT | Generate draft email — no sending capability |
| `create_pending_action` | CODE | Persist action as draft, compute idempotency key |
| `await_human_approval` | HUMAN | Checkpoint — requires API call to progress |
| `execute_approved_action` | CODE | Idempotent execution via approval gateway |
| `finalize_workflow` | CODE | Mark workflow complete |

## Retry Policies

- **Deterministic steps**: 2 retries, 0.5s delay
- **Agent steps**: 2 retries, 2s delay with exponential backoff
- **External actions**: 3 retries, 1s delay
- **Human approval**: No auto-retry

## Parallelization

The enrichment stage runs three operations concurrently:
1. Commute calculation per listing (bounded semaphore: `MAX_CONCURRENT_ENRICHMENTS`)
2. Neighbourhood research per neighbourhood (bounded semaphore)
3. Qualitative evaluation per shortlisted listing (bounded semaphore)

Each sub-task result is independent — partial progress survives failures.

## Persistence

Every step transition is persisted to:
- `workflow_runs` — current state, completed steps, retry count
- `step_executions` — per-step timing, status, errors
- `audit_events` — chronological event stream

Workflow context data (listings, evaluations, shortlist) flows through in-memory context during execution. On resume, the controller reconstructs state from database records.

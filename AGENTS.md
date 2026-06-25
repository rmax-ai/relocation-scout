# AGENTS.md — Relocation Scout

## System Purpose

Relocation Scout is a proof-of-concept agentic system demonstrating correct decomposition of an AI workflow. It helps users search housing listings, enrich them with commute and neighbourhood data, rank them, and draft realtor messages — with explicit human approval before any external communication.

**Core thesis:** Use code for determinism, agents for judgment, and humans for authority.

## Architectural Invariants

These rules are non-negotiable. Any code that violates them must be rejected in review.

1. **Agents never execute external side effects.** Agents cannot call the email tool or any tool that modifies external state.
2. **All side effects pass through ApprovalGateway.** The code-level gateway enforces this — not prompts.
3. **All LLM outputs are schema-validated.** Output is parsed into a Pydantic model before any downstream code sees it. Invalid outputs are rejected (with one repair attempt).
4. **External content is always untrusted.** All listing content, especially `description`, passes through `wrap_untrusted_content()` before reaching any agent.
5. **Workflow state is stored outside model context.** State lives in SQLite. Agents receive only the data they need for their task, not the full conversation history.
6. **Deterministic values cannot be overwritten by agent output.** Agents provide qualitative assessments; commute times, rent values, and hard constraint results are computed by code and are immutable.
7. **Every external action requires an idempotency key.** Format: `{action_type}:{listing_id}:{recipient}:{payload_hash}`.
8. **Approved payloads cannot change without invalidating approval.** Payload hash is computed at approval time and verified at execution time.
9. **Route handlers must not contain business logic.** Routes call service/repository layers. Business logic lives in the workflow controller and deterministic pipeline.
10. **Mock mode must remain fully functional without API keys.** Every agent path must work with the mock runtime.

## Component Ownership

| Directory | Owns | Rules |
|-----------|------|-------|
| `backend/src/relocation_scout/contracts/` | Pydantic models for all domain types | No business logic; pure data models with validators |
| `backend/src/relocation_scout/workflow/` | State machine, step implementations, controller | Only this layer changes workflow state |
| `backend/src/relocation_scout/deterministic/` | Normalization, dedup, commute, filtering, scoring | Pure functions, no I/O, no LLM calls |
| `backend/src/relocation_scout/agents/` | Agent interfaces, mock/ADK runtimes, agent implementations | Agents produce typed outputs; never mutate state |
| `backend/src/relocation_scout/tools/` | Mock external services (listings, maps, email) | Only the tool registry exposes tools; agents get read-only subset |
| `backend/src/relocation_scout/persistence/` | SQLAlchemy models, database, repositories, UoW | No business logic; pure data access |
| `backend/src/relocation_scout/security/` | Untrusted input wrapper, prompt injection scanner, redaction | Applied at system boundaries |
| `backend/src/relocation_scout/observability/` | Structured logging, audit events, tracing, metrics | All components emit events through this layer |
| `frontend/src/` | React UI | Consumes REST API; never contains business logic |

## Change Rules

### Adding a new workflow step
1. Add step name to `WorkflowStatus` enum in `contracts/workflow.py`
2. Add transition rule in `workflow/transitions.py`
3. Implement step class in `workflow/steps.py` (implement `WorkflowStep` protocol)
4. Register step in `workflow/controller.py`
5. Add audit events for step start/complete/fail
6. Add tests in `tests/unit/test_workflow.py` and `tests/scenarios/`

### Adding a new agent
1. Define input/output contracts in `contracts/` (if new models needed)
2. Create agent module in `agents/` implementing `AgentInterface`
3. Add mock responses in `agents/mock_runtime.py`
4. Register agent in the workflow step that invokes it
5. Add validation tests in `tests/contracts/`
6. Add prompt injection tests in `tests/security/`

### Adding a new tool
1. Create tool module in `tools/`
2. If it's an external side effect tool: register it only in `tool_registry.py` for the workflow controller — NOT in the agent tool registry
3. If it's a read-only tool for agents: register in the agent tool subset
4. Add appropriate audit events

### Introducing a side effect safely
1. Define the action type in `contracts/action.py`
2. Implement the tool in `tools/`
3. Ensure it goes through `ApprovalGateway` (draft → pending_approval → approved → execute)
4. Implement idempotency key generation
5. Add audit events for all state transitions
6. Test approval bypass prevention
7. Test idempotency
8. Test crash recovery

### Updating contracts
1. If a contract is used for persistence: create an Alembic migration
2. If a contract is used in API: update the route handler's response model
3. If a contract is used by agents: update mock responses and validation tests
4. Always add backward-compatibility notes in `docs/decisions/`

### Writing migrations
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```
Always review autogenerated migrations before committing.

### Adding evaluation cases
1. Add test scenario in `tests/scenarios/`
2. If new agent behavior, add fixture case in `data/`
3. Update `docs/evaluation.md`

## Verification Commands

```bash
# Backend
cd backend
ruff format --check src/ tests/       # Formatting
ruff check src/ tests/                # Linting
uv run pyright src/                   # Type checking (if configured)
uv run pytest tests/ -v               # Unit + integration tests
uv run pytest tests/ -v -k "scenario" # Scenario tests

# Frontend
cd frontend
npm run lint                          # oxlint (0 warnings required)
npm run build                         # tsc + Vite build
npm test                               # Vitest (8 component smoke tests)
npm run typecheck                      # tsc --noEmit

# Full verification
make verify                           # Runs all above + API health check
```

## Python Conventions

- Python 3.12 with `from __future__ import annotations` everywhere
- Pydantic v2 with `model_validator` and `field_validator`
- SQLAlchemy 2.0 style (Mapped, mapped_column, DeclarativeBase)
- Async where reasonable (FastAPI async endpoints, async session)
- Tenacity for retries
- Structlog for structured logging
- `src/` layout: source in `backend/src/relocation_scout/`, tests in `backend/tests/`

## TypeScript Conventions

- React 19+ with TypeScript strict mode
- TanStack Query v5 for server state
- React Router v6 for routing
- Tailwind CSS for styling
- No `any` types unless genuinely unavoidable (document with comment)

## Testing Philosophy

- Deterministic code: 100% unit tested
- Agent code: fixture-based contract tests + scenario tests
- Integration: test API endpoints against real SQLite
- Security: dedicated security test suite for injection, approval bypass, idempotency
- Recovery: simulated crash scenarios with state verification

## Project DNA

This is NOT a chatbot. It is a governed workflow engine. The UI exposes system state — it is not a conversational interface. Agents are narrowly-scoped components, not autonomous actors. The approval gateway is a code-level enforcement point, not a prompt. Every design decision should be evaluated against the core thesis: determinism wins where correctness is binary; agents help where judgment is needed; humans retain authority over external effects.

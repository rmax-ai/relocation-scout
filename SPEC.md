# Relocation Scout — Specification

## Scope

A production-oriented agentic systems proof-of-concept demonstrating governed AI workflow architecture. The system helps users search housing listings, enrich them with commute and neighbourhood data, rank them deterministically + via agent judgment, draft realtor messages, and execute approved external actions — all with deterministic safety guarantees.

**Core thesis:** Use code for determinism, agents for judgment, and humans for authority.

## Architecture

Three-plane separation:

| Plane | Responsibility | Examples |
|-------|---------------|----------|
| **Deterministic** | Binary correctness | Normalization, dedup, commute calc, hard filters, scoring, state machine, idempotency |
| **Agentic** | Judgment & interpretation | Neighbourhood assessment, qualitative ranking, shortlist synthesis, message drafting |
| **Human** | External side-effect authority | Approve/reject realtor messages |

Key invariants:
- Agents never execute external side effects (no tool access)
- All side effects pass through approval gateway
- All LLM outputs are schema-validated (Pydantic v2)
- External content is wrapped as untrusted
- Workflow state lives in SQLite, not LLM context
- Every external action has an idempotency key
- Approved payloads cannot change without invalidating approval

## Acceptance Criteria

### Phase 1 — Core Foundation ✓
- [x] AC-1: Repository with src/ layout, pyproject.toml, MIT license
- [x] AC-2: All Pydantic domain contracts (preferences, listings, research, ranking, workflow, approval, audit, actions)
- [x] AC-3: .env.example with documented configuration

### Phase 2 — Persistence ✓
- [x] AC-4: SQLAlchemy 2.0 models (12 entities)
- [x] AC-5: SQLite database with async session
- [x] AC-6: Repository pattern per entity
- [x] AC-7: Unit of Work transaction boundary

### Phase 3 — Deterministic Pipeline ✓
- [x] AC-8: Multi-provider listing normalization
- [x] AC-9: Cross-provider deduplication
- [x] AC-10: Commute calculation with concurrency control
- [x] AC-11: Hard constraint filtering (budget, bedrooms, commute, neighbourhood, area)
- [x] AC-12: Deterministic scoring (affordability, commute, neighbourhood, space)

### Phase 4 — Workflow Engine ✓
- [x] AC-13: 13-step state machine with validated transitions
- [x] AC-14: Workflow controller with step execution, retries, recovery
- [x] AC-15: Persistent workflow state (resumable after crash)
- [x] AC-16: Structured audit events at every step boundary

### Phase 5 — Agent Layer ✓
- [x] AC-17: AgentInterface protocol (4 methods)
- [x] AC-18: Mock runtime with deterministic canned responses
- [x] AC-19: Agent output validation with one repair attempt
- [x] AC-20: Neighbourhood research agent
- [x] AC-21: Qualitative ranking agent
- [x] AC-22: Shortlist synthesis agent
- [x] AC-23: Message drafting agent
- [x] AC-24: ADK runtime for live Gemini mode

### Phase 6 — Security ✓
- [x] AC-25: Untrusted content wrapper (wrap_untrusted_content)
- [x] AC-26: Prompt injection scanner (8+ patterns)
- [x] AC-27: System prompt templates with injection defenses
- [x] AC-28: Redaction module

### Phase 7 — Tools ✓
- [x] AC-29: Listing provider (mock, multi-provider JSON fixtures)
- [x] AC-30: Maps service (mock, neighbourhood facts)
- [x] AC-31: Email service (mock, persistent to SQLite)
- [x] AC-32: Tool registry with agent vs system classification
- [x] AC-33: Approval gateway (draft → pending → approved → executing → completed)

### Phase 8 — Idempotent Action Executor ✓
- [x] AC-34: Idempotency key generation (action_type:listing_id:recipient:payload_hash)
- [x] AC-35: Payload hash binding at approval time
- [x] AC-36: Atomic execution with crash recovery
- [x] AC-37: Reconciliation process (detect already-sent email after crash)

### Phase 9 — API Layer ✓
- [x] AC-38: FastAPI with async endpoints, CORS
- [x] AC-39: Search CRUD + start/resume/reset
- [x] AC-40: Listing endpoints with filtering
- [x] AC-41: Workflow status and step inspection
- [x] AC-42: Action/approval endpoints
- [x] AC-43: Audit log with JSON export
- [x] AC-44: Demo controls with failure injection

### Phase 10 — Frontend ✓
- [x] AC-45: React 19 + TypeScript + Vite
- [x] AC-46: Tailwind CSS dark theme
- [x] AC-47: TanStack Query v5 for server state
- [x] AC-48: React Router v6 with 10 pages
- [x] AC-49: Search creation, listings, shortlist, approval inbox, audit log, demo controls

### Phase 11 — Seed Data ✓
- [x] AC-50: 13 Amsterdam-area listings (JSON, multi-provider)
- [x] AC-51: Neighbourhood fixture data (JSON)
- [x] AC-52: Demo preferences
- [x] AC-53: Failure injection scenarios (8 types)

### Phase 12 — Tests ✓
- [x] AC-54: 26 unit tests passing (contracts, deterministic, security, workflow)
- [x] AC-55: Prompt injection detection tested
- [x] AC-56: Hard constraint validation tested
- [x] AC-57: Approval payload binding tested
- [x] AC-58: State transition validation tested
- [x] AC-59: Agent output immutability tested (cannot override deterministic scores)

### Phase 13 — Docker & DX ✓
- [x] AC-60: Dockerfile (backend + frontend)
- [x] AC-61: docker-compose.yml
- [x] AC-62: Makefile with install/dev/test/seed/reset/demo/verify/clean
- [x] AC-63: One-command demo startup

### Phase 14 — Documentation ✓
- [x] AC-64: README with architecture overview, quickstart, commands
- [x] AC-65: ARCHITECTURE.md with component diagrams, trust boundaries, data flow
- [x] AC-66: THREAT_MODEL.md with 10 threats, attack paths, controls, residual risk
- [x] AC-67: ROADMAP.md with 14 phases and dependency graph
- [x] AC-68: AGENTS.md with coding conventions and change rules
- [x] AC-69: 4 ADRs (SQLite-first, workflow controller, approval gateway, agent framework isolation)
- [x] AC-70: demo-script.md (5-minute walkthrough)
- [x] AC-71: docs/ (workflow.md, contracts.md, recovery.md, evaluation.md)

## Mock Mode

Default mode. No API keys required. All agents use deterministic canned responses. All 26 tests pass.

## Live Mode (Optional)

Set `AGENT_RUNTIME=adk` and provide `GOOGLE_API_KEY`. Uses Gemini 2.5 Flash through Google ADK. Same contracts, same validation, same security boundaries — only the agent judgment source changes.

## Limitations (PoC)

- SQLite (single-process, no replication)
- No authentication/authorization
- Mock email (writes to local DB only)
- Single user (no multi-tenancy)
- No real maps API integration
- Frontend tests pending

## Production Hardening Roadmap

1. PostgreSQL with Alembic migrations to production DB
2. OAuth2/OIDC authentication + RBAC
3. Real email delivery (SendGrid/SES) with idempotency
4. Real maps API (Google Maps/OSRM)
5. Async task queue (Celery/ARQ) for long-running workflows
6. Prometheus metrics + distributed tracing
7. Secret management (Vault/AWS Secrets Manager)
8. API rate limiting + request validation
9. Container orchestration with health checks
10. Multi-tenancy with tenant isolation

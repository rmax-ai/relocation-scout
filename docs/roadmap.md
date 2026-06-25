# Relocation Scout — Implementation Roadmap

## Phase 0 — Architecture Documents ✓
- [x] ARCHITECTURE.md
- [x] THREAT_MODEL.md
- [x] ROADMAP.md (this file)
- [x] AGENTS.md

## Phase 1 — Repository Skeleton & Contracts
**Deliverables:**
- [ ] Repository directory structure
- [ ] pyproject.toml with dependencies
- [ ] All Pydantic domain contracts (9 files)
- [ ] `.env.example`
- [ ] LICENSE (MIT)

## Phase 2 — Persistence Layer
**Deliverables:**
- [ ] SQLAlchemy models for all entities
- [ ] Database setup with SQLite
- [ ] Alembic migrations
- [ ] Repository classes per entity
- [ ] Unit of Work / transaction boundary

## Phase 3 — Deterministic Pipeline
**Deliverables:**
- [ ] Listing normalization
- [ ] Deduplication (cross-provider)
- [ ] Commute calculation (mocked maps service)
- [ ] Hard constraint filtering
- [ ] Numeric scoring (affordability, commute, neighbourhood)
- [ ] Validation utilities

## Phase 4 — Workflow Engine
**Deliverables:**
- [ ] WorkflowStatus enum and state machine
- [ ] WorkflowStep protocol
- [ ] Step implementations (14 steps)
- [ ] Workflow controller with transition validation
- [ ] Retry policies
- [ ] Recovery and resume logic
- [ ] Audit event emission

## Phase 5 — Agent Layer
**Deliverables:**
- [ ] Agent interface (Protocol)
- [ ] Mock runtime with deterministic responses
- [ ] Agent output validation and repair
- [ ] Neighbourhood research agent
- [ ] Qualitative ranking agent
- [ ] Shortlist synthesis agent
- [ ] Message drafting agent
- [ ] ADK runtime (optional live mode)

## Phase 6 — Security Layer
**Deliverables:**
- [ ] Untrusted input wrapper
- [ ] Prompt injection scanner
- [ ] Redaction module
- [ ] System prompt templates with injection defenses

## Phase 7 — Tools & External Services
**Deliverables:**
- [ ] Listing provider (mock, multi-provider)
- [ ] Maps service (mock, deterministic)
- [ ] Email service (mock, persistent)
- [ ] Tool registry
- [ ] Approval gateway

## Phase 8 — Idempotent Action Executor
**Deliverables:**
- [ ] Action executor with idempotency key flow
- [ ] Completed actions store
- [ ] Payload hash verification
- [ ] Atomic execution with crash recovery
- [ ] Reconciliation process

## Phase 9 — API Layer
**Deliverables:**
- [ ] FastAPI application setup
- [ ] Configuration and dependency injection
- [ ] Search endpoints (CRUD + start/resume/reset)
- [ ] Listing endpoints
- [ ] Workflow status/step endpoints
- [ ] Action and approval endpoints
- [ ] Audit endpoints
- [ ] Demo and failure injection endpoints
- [ ] Metrics endpoint
- [ ] Structured error responses
- [ ] OpenAPI documentation

## Phase 10 — Frontend
**Deliverables:**
- [ ] React + TypeScript + Vite setup
- [ ] Tailwind CSS configuration
- [ ] TanStack Query API client
- [ ] React Router setup
- [ ] Global layout with navigation
- [ ] Search creation page
- [ ] Search overview page
- [ ] Workflow visualization page
- [ ] Listings page (with filters)
- [ ] Listing detail page
- [ ] Shortlist page
- [ ] Approval inbox page
- [ ] Audit log page
- [ ] Demo controls page

## Phase 11 — Seed Data & Scenarios
**Deliverables:**
- [ ] 12+ Amsterdam-area listings (JSON)
- [ ] Neighbourhood fixture data (JSON)
- [ ] Demo preferences
- [ ] Seed script
- [ ] Failure injection scenarios
- [ ] Demo reset script

## Phase 12 — Tests
**Deliverables:**
- [ ] Unit tests (contracts, deterministic pipeline, state machine)
- [ ] Integration tests (API endpoints, database)
- [ ] Contract tests (schema validation)
- [ ] Security tests (prompt injection, approval bypass)
- [ ] Recovery tests (crash scenarios)
- [ ] Scenario tests (6 end-to-end scenarios)
- [ ] Frontend tests

## Phase 13 — Docker & Developer Experience
**Deliverables:**
- [ ] Backend Dockerfile
- [ ] Frontend Dockerfile
- [ ] docker-compose.yml
- [ ] Makefile
- [ ] One-command startup (`make dev`)
- [ ] One-command tests (`make test`)
- [ ] One-command demo reset (`make reset`)

## Phase 14 — Documentation & Verification
**Deliverables:**
- [ ] README.md
- [ ] docs/workflow.md
- [ ] docs/contracts.md
- [ ] docs/recovery.md
- [ ] docs/evaluation.md
- [ ] docs/demo-script.md
- [ ] ADRs (4 decisions)
- [ ] Repository verification script
- [ ] Final acceptance criteria check

## Dependencies

```
Phase 1  ──► Phase 2  ──► Phase 3
                │              │
                ▼              ▼
            Phase 4  ◄─── Phase 5
                │              │
                ▼              ▼
            Phase 6       Phase 7
                │              │
                └──────┬───────┘
                       ▼
                   Phase 8
                       │
                       ▼
                   Phase 9  ──► Phase 10
                       │
                       ▼
                   Phase 11 ──► Phase 12
                                    │
                                    ▼
                               Phase 13
                                    │
                                    ▼
                               Phase 14
```

# Relocation Scout

**Production-oriented agentic systems proof-of-concept.**

A house-hunting assistant that demonstrates how to engineer a governed AI workflow — not a prompt wrapper.

## Architectural Thesis

> **Use code for determinism, agents for judgment, and humans for authority.**

- **Code** handles normalization, deduplication, hard constraints, scoring, state transitions, approval enforcement, idempotency, retries, and audit logging
- **Agents** handle neighbourhood assessment, qualitative ranking, shortlist synthesis, and message drafting — but have **no access to external tools**
- **Humans** retain final authority over any external side effect via an approval gateway

The LLM is a narrowly-scoped component inside a larger software system. The workflow state machine, persistence, contracts, and security boundaries are all conventional engineering.

## Quick Start

Prerequisites:
- `uv` for Python dependency management
- `npm` for frontend dependencies

```bash
# Install uv if needed
# macOS (Homebrew): brew install uv

# Install dependencies
make install

# Start backend + frontend
make dev

# Or seed demo data and start
make demo
```

Backend: http://localhost:8000/docs (OpenAPI)
Frontend: http://localhost:5173

## Environment

Copy `.env.example` to `.env`. Defaults work for mock mode (no API keys required).

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/relocation_scout.db` | SQLite for local dev |
| `AGENT_RUNTIME` | `mock` | `mock` (deterministic) or `adk` (Gemini) |
| `MAX_CONCURRENT_ENRICHMENTS` | `4` | Concurrency limit for parallel steps |
| `LOG_LEVEL` | `INFO` | `DEBUG` for verbose |

## Workflow

```
User creates search → preferences persisted
  → fetch_listings (CODE)
  → normalize_listings (CODE)
  → deduplicate_listings (CODE)
  → calculate_commutes (CODE, parallel)
  → research_neighbourhoods (AGENT, parallel)
  → calculate_deterministic_scores (CODE)
  → generate_qualitative_evaluations (AGENT, parallel)
  → build_shortlist (CODE + AGENT)
  → draft_realtor_message (AGENT)
  → create_pending_action (CODE)
  → await_human_approval (HUMAN)
  → execute_approved_action (CODE)
  → completed
```

## Architecture

| Plane | Responsibility | Examples |
|-------|---------------|----------|
| **Deterministic** | Binary correctness | Normalization, dedup, commute calc, hard filters, scoring, state machine, idempotency |
| **Agentic** | Judgment & interpretation | Neighbourhood assessment, qualitative ranking, shortlist synthesis, message drafting |
| **Human** | External side-effect authority | Approve/reject realtor messages, confirm viewing requests |

Key invariants:
- Agents never execute external side effects
- All side effects pass through the approval gateway
- All LLM outputs are schema-validated (Pydantic)
- External content is always treated as untrusted
- Workflow state lives in SQLite, not in LLM context
- Every external action has an idempotency key

## Documentation

| Document | Contents |
|----------|----------|
| [architecture.md](docs/architecture.md) | Component architecture, trust boundaries, data flow |
| [THREAT_MODEL.md](docs/threat-model.md) | 10 threats with attack paths, controls, residual risk |
| [ROADMAP.md](docs/roadmap.md) | Phase breakdown with dependencies |
| [AGENTS.md](AGENTS.md) | Coding agent conventions and change rules |
| [demo-script.md](docs/demo-script.md) | 5-minute demo walkthrough |

## Commands

```bash
make install      # Install all dependencies
make dev          # Start backend + frontend
make test         # Run all backend tests
make lint         # Ruff check + format check
make seed         # Seed demo data
make reset        # Reset database
make demo         # Reset + seed + start
make verify       # Full verification
make clean        # Remove venv, node_modules, DB
```

## Tests

```bash
make test         # 26 unit tests (contracts, deterministic, security, workflow)
```

Coverage: priority weight validation, deduplication, normalization, prompt injection detection, hard constraints, deterministic scoring, state transitions, approval payload binding, audit events, agent output validation, and more.

## Mock Mode

Default mode. No API keys required. All agents use deterministic canned responses. Suitable for CI, demos, and development.

## Live Mode (Optional)

Set `AGENT_RUNTIME=adk` and provide `GOOGLE_API_KEY`. Uses Gemini through Google ADK.

## Limitations

- **PoC, not production**: SQLite, single-process, no auth, mock email
- **Mock agent responses**: Deterministic canned outputs; real LLM behavior may vary
- **No real email delivery**: Mock email writes to local SQLite only
- **Single user**: No multi-tenancy or RBAC

## Production Hardening

1. Replace SQLite with PostgreSQL
2. Add authentication/authorization (OAuth2/OIDC)
3. Implement proper RBAC for approval decisions
4. Add real email delivery (SendGrid, SES) with idempotency
5. Add real maps API for commute calculation
6. Implement async task queue (Celery/ARQ) for long-running workflows
7. Add Prometheus metrics and distributed tracing
8. Implement proper secret management (Vault, AWS Secrets Manager)
9. Add API rate limiting and request validation
10. Containerize with health checks and graceful shutdown

# ADR 001: SQLite for Local Development

**Status:** Accepted

**Date:** 2026-06-25

## Context

The Relocation Scout PoC needs a persistence layer for workflow state, listings, evaluations, actions, and audit events. The project must start with zero external dependencies.

## Decision

Use SQLite via SQLAlchemy 2 + aiosqlite for async access.

## Rationale

- **Zero-config:** No PostgreSQL/MySQL installation required for local dev or CI
- **Full SQL:** SQLAlchemy abstracts the dialect; migration to PostgreSQL is a connection string change
- **Alembic migrations:** Schema versioning works identically with SQLite
- **Async support:** aiosqlite provides async-compatible access matching FastAPI's async pattern
- **Single-writer:** Acceptable for a PoC with one user

## Consequences

- **Positive:** One-command startup with no infrastructure
- **Positive:** CI runs without database services
- **Negative:** Concurrent writes are serialized (SQLite limitation)
- **Negative:** Some PostgreSQL features unavailable (array types, JSONB operators)
- **Migration path:** Trivial — change `DATABASE_URL` to PostgreSQL, run `alembic upgrade head`

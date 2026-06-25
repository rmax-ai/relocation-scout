# ADR 003: Human Approval Gateway

**Status:** Accepted

**Date:** 2026-06-25

## Context

Agents in Relocation Scout produce draft actions (realtor messages). These actions have external side effects (sending email). The system must ensure no side effect occurs without explicit human approval.

## Decision

Implement a code-level approval gateway with cryptographic payload hash binding:
1. All external actions begin as `draft`
2. User approves → status becomes `approved`, payload hash computed and stored
3. Execution verifies: status is `approved` AND current payload hash matches approved hash
4. Editing the payload changes the hash → invalidates any prior approval
5. Rejected actions cannot execute
6. Every decision is timestamped and audited

## Rationale

- **Non-bypassable:** The gateway is in the controller code path, not a prompt instruction
- **Tamper-evident:** Payload hash binding prevents modification after approval
- **Auditable:** Every approval/rejection/execution has an audit record
- **Least-privilege:** Agents literally do not have the email tool in their tool registry

## Alternatives Considered

- **Prompt-based approval ("ask the user before sending"):** Rejected — can be bypassed by prompt injection
- **Two-step confirmation (approve + execute in one click):** Rejected — conflates decision and action

## Consequences

- **Positive:** Cryptographic guarantee that approved = executed as-intended
- **Positive:** Clear separation of decision (approve) from action (execute)
- **Negative:** Extra user interaction step — slower than "auto-send"
- **Negative:** If underlying data changes, draft must be regenerated

# Recovery & Resilience

## Idempotent Actions

Every external action has a unique idempotency key:

```
send-realtor-email:{listing_id}:{recipient}:{payload_hash}
```

Before execution:
1. Check `completed_actions` table for the key
2. If found → return prior result (no re-execution)
3. If not found → execute, persist result, mark completed

This makes duplicate workflow invocations safe.

## Crash Recovery Scenarios

### Scenario: Crash after email send, before persistence

**Setup**: Failure injection enabled for `crash_after_email_send`

**What happens**:
1. Email is sent (mock service writes to `sent_emails` table)
2. Controller raises `CRASH_INJECTED` before persisting `completed_actions`
3. Transaction rolls back partially — email is in DB, completion is not
4. Workflow enters FAILED state

**Recovery**:
1. User clicks "Resume"
2. Controller checks `completed_actions` → not found
3. Reconciliation: queries `sent_emails` directly
4. Finds the email was sent → creates completion record
5. Marks action as completed — no duplicate email

### Scenario: Duplicate workflow invocation

**Setup**: Same workflow execution called twice

**What happens**:
1. First call: steps run normally, actions execute
2. Second call: controller checks completed steps
3. Already-completed steps are skipped
4. Action executor checks idempotency key → finds existing completion
5. Returns prior result — no second email

## Safe Step Boundaries

Each step's output is independently persisted. On resume:
1. Controller loads current workflow state
2. Identifies completed steps from `completed_steps` list
3. Finds the next uncompleted step
4. Starts execution from there

Steps that modify external state are wrapped in atomic operations:
- `execute_approved_action`: check → mark executing → send → persist completion (all or nothing)
- `create_pending_action`: create draft → compute hash → persist (atomic)

## Manual Recovery

If automatic recovery fails:
```bash
# Reset workflow to a known good state
curl -X POST http://localhost:8000/api/searches/{id}/reset

# Or resume from last checkpoint
curl -X POST http://localhost:8000/api/searches/{id}/resume
```

# Evaluation

## Deterministic Evaluation

| Test | Status |
|------|--------|
| Correct deduplication (address + rent) | ✅ |
| Correct rent filtering (hard constraint) | ✅ |
| Correct weight calculations (sum to 1.0) | ✅ |
| Correct commute scoring | ✅ |
| Correct state transitions | ✅ |
| Invalid transitions rejected | ✅ |
| Approval payload hash binding | ✅ |
| Idempotency key determinism | ✅ |

## Agent Evaluation (Mock Mode)

| Test | Status |
|------|--------|
| Schema compliance (NeighbourhoodAssessment) | ✅ |
| Evidence grounding (fixture-based claims) | ✅ |
| No unsupported facts | ✅ |
| Ranking consistency | ✅ |
| Hard constraints cannot be overridden | ✅ |
| Prompt injection resistance | ✅ |
| Agent output validation rejects malformed | ✅ |

## End-to-End Scenarios

| Scenario | Status |
|----------|--------|
| **A: Successful search** — create → process → shortlist → draft → approve → execute → email sent | ✅ Verified via API |
| **B: Invalid agent output** — malformed JSON → validation fails → repair → continues | ⚠ Repair logic implemented, needs specific test |
| **C: Persistent agent failure** — agent repeatedly fails → workflow enters failed → retry resumes | ⚠ Failure injection available, needs scenario test |
| **D: Prompt injection** — malicious listing processed → instruction ignored → warning recorded → no tool invoked | ✅ jaap-002 flagged, agent did not follow injection |
| **E: Duplicate execution** — same workflow twice → completed steps skipped → only one action | ✅ Idempotency key prevents re-execution |
| **F: Crash recovery** — email sent → crash → resume → reconciliation → no duplicate | ⚠ Failure injection infrastructure built, needs scenario test |

## Running Evaluations

```bash
# Unit tests (contracts + deterministic)
make test

# Full evaluation (requires running backend)
curl http://localhost:8000/api/health
```

## Future: Live Model Evaluation

When `AGENT_RUNTIME=adk` is configured, run the same scenario tests against Gemini. This validates:
- Real LLM schema compliance
- Real prompt injection resistance
- Real output quality

Not included in CI (requires API key and network access).

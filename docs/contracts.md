# Relocation Scout — Contracts Reference

All inter-component communication uses typed Pydantic v2 models. Free-form text never crosses boundaries without a schema wrapper.

## Core Types

### PriorityWeights
```python
class PriorityWeights(BaseModel):
    quiet: float = 0.25
    transport: float = 0.25
    green_space: float = 0.25
    affordability: float = 0.25
    # Constraint: sum == 1.0
```

### HousingPreferences
User search criteria: max rent, min bedrooms, commute limit, neighbourhood preferences, weight priorities, free-text notes.

### Listing / NormalizedListing
Standardized representation of a housing listing from any provider. NormalizedListing adds `source_payload_hash`, `is_suspicious`, and `suspicion_reasons`.

### NeighbourhoodAssessment
Agent output: quiet/transport/green scores, summary, strengths, concerns, and evidence items. Each EvidenceItem has source type (fixture/tool/model), claim, value, and confidence.

### ListingEvaluation
Per-listing evaluation: hard constraint status, affordability/commute/neighbourhood/qualitative scores, overall score, strengths, concerns, recommendation level (strong_match/possible_match/weak_match/reject), and evidence IDs.

### WorkflowState
Current workflow status, prior status, completed steps, retry count, last error, resumability flag.

### PendingAction
Draft external action with status lifecycle: draft → pending_approval → approved/rejected → executing → completed/failed. Includes idempotency key and payload hash.

### ApprovalDecision
Timestamped approval or rejection with optional edited payload and comment.

### AuditEvent
Chronological event with type (from AuditEventType enum), actor (system/deterministic/agent/human/tool), search ID, workflow step, entity reference, message, and metadata.

## Contracts Directory

```
contracts/
├── listing.py       # Listing, NormalizedListing, Coordinates
├── preferences.py   # PriorityWeights, HousingPreferences
├── research.py      # EvidenceItem, NeighbourhoodAssessment, CommuteResult
├── ranking.py       # ListingEvaluation, RecommendationLevel
├── shortlist.py     # ShortlistEntry, Shortlist
├── workflow.py      # WorkflowStatus, WorkflowState, WorkflowContext, StepResult
├── action.py        # PendingAction, CompletedAction, ActionType, ActionStatus
├── approval.py      # ApprovalDecision
└── audit.py         # AuditEvent, AuditEventType, ActorType
```

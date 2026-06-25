from __future__ import annotations

from relocation_scout.contracts.workflow import WorkflowStatus

# Valid transitions: current status -> set of allowed next statuses
VALID_TRANSITIONS: dict[WorkflowStatus, set[WorkflowStatus]] = {
    WorkflowStatus.CREATED: {WorkflowStatus.LISTINGS_FETCHED, WorkflowStatus.FAILED},
    WorkflowStatus.LISTINGS_FETCHED: {WorkflowStatus.LISTINGS_NORMALIZED, WorkflowStatus.FAILED},
    WorkflowStatus.LISTINGS_NORMALIZED: {
        WorkflowStatus.LISTINGS_DEDUPLICATED,
        WorkflowStatus.FAILED,
    },
    WorkflowStatus.LISTINGS_DEDUPLICATED: {
        WorkflowStatus.ENRICHMENT_RUNNING,
        WorkflowStatus.FAILED,
    },
    WorkflowStatus.ENRICHMENT_RUNNING: {WorkflowStatus.ENRICHMENT_COMPLETE, WorkflowStatus.FAILED},
    WorkflowStatus.ENRICHMENT_COMPLETE: {WorkflowStatus.RANKING_COMPLETE, WorkflowStatus.FAILED},
    WorkflowStatus.RANKING_COMPLETE: {WorkflowStatus.SHORTLIST_CREATED, WorkflowStatus.FAILED},
    WorkflowStatus.SHORTLIST_CREATED: {WorkflowStatus.AWAITING_APPROVAL, WorkflowStatus.FAILED},
    WorkflowStatus.AWAITING_APPROVAL: {WorkflowStatus.ACTION_EXECUTED, WorkflowStatus.FAILED},
    WorkflowStatus.ACTION_EXECUTED: {WorkflowStatus.COMPLETED, WorkflowStatus.FAILED},
    WorkflowStatus.COMPLETED: set(),
    WorkflowStatus.FAILED: {WorkflowStatus.FAILED},  # Can retry from FAILED
}


def is_valid_transition(current: WorkflowStatus, next_status: WorkflowStatus) -> bool:
    allowed = VALID_TRANSITIONS.get(current, set())
    return next_status in allowed


def get_allowed_transitions(current: WorkflowStatus) -> set[WorkflowStatus]:
    return VALID_TRANSITIONS.get(current, set())

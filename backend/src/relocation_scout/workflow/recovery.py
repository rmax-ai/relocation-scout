from __future__ import annotations

from relocation_scout.contracts.workflow import WorkflowStatus


def get_next_step_for_status(status: WorkflowStatus) -> str | None:
    """Get the next step to execute based on current status."""
    status_to_step: dict[WorkflowStatus, str | None] = {
        WorkflowStatus.CREATED: "fetch_listings",
        WorkflowStatus.LISTINGS_FETCHED: "normalize_listings",
        WorkflowStatus.LISTINGS_NORMALIZED: "deduplicate_listings",
        WorkflowStatus.LISTINGS_DEDUPLICATED: "calculate_commutes",
        WorkflowStatus.ENRICHMENT_RUNNING: None,  # In progress, sub-steps
        WorkflowStatus.ENRICHMENT_COMPLETE: "calculate_deterministic_scores",
        WorkflowStatus.RANKING_COMPLETE: "build_shortlist",
        WorkflowStatus.SHORTLIST_CREATED: "draft_realtor_message",
        WorkflowStatus.AWAITING_APPROVAL: "execute_approved_action",
        WorkflowStatus.ACTION_EXECUTED: "finalize_workflow",
        WorkflowStatus.COMPLETED: None,
        WorkflowStatus.FAILED: None,
    }
    return status_to_step.get(status)


def should_resume_from_checkpoint(status: WorkflowStatus) -> bool:
    """Check if workflow can resume from current status."""
    return status not in (WorkflowStatus.COMPLETED, WorkflowStatus.CREATED)


def compute_resume_point(
    status: WorkflowStatus,
    completed_steps: list[str],
    workflow_data: dict,
) -> tuple[WorkflowStatus, str | None]:
    """
    Compute where to resume after a failure or restart.
    Returns: (status_to_resume_from, next_step_to_run)
    """
    # If FAILED, determine last good state from completed steps
    if status == WorkflowStatus.FAILED:
        # Walk backwards through the pipeline to find the last completed state
        pipeline = [
            (WorkflowStatus.CREATED, "fetch_listings"),
            (WorkflowStatus.LISTINGS_FETCHED, "normalize_listings"),
            (WorkflowStatus.LISTINGS_NORMALIZED, "deduplicate_listings"),
            (WorkflowStatus.LISTINGS_DEDUPLICATED, "calculate_commutes"),
            (WorkflowStatus.ENRICHMENT_COMPLETE, "calculate_deterministic_scores"),
            (WorkflowStatus.RANKING_COMPLETE, "build_shortlist"),
            (WorkflowStatus.SHORTLIST_CREATED, "draft_realtor_message"),
            (WorkflowStatus.AWAITING_APPROVAL, "execute_approved_action"),
            (WorkflowStatus.ACTION_EXECUTED, "finalize_workflow"),
        ]

        for resume_status, _next_step in reversed(pipeline):
            if resume_status.value.replace("_", " ") in completed_steps or any(
                step.startswith(resume_status.value) for step in completed_steps
            ):
                return resume_status, get_next_step_for_status(resume_status)

        # Nothing found — start from beginning
        return WorkflowStatus.CREATED, "fetch_listings"

    # If not failed, just continue from current status
    next_step = get_next_step_for_status(status)
    return status, next_step

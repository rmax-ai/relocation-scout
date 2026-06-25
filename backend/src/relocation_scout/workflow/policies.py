from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RetryPolicy:
    max_retries: int = 3
    delay_seconds: float = 1.0
    backoff_multiplier: float = 2.0
    max_delay_seconds: float = 30.0
    retryable_exceptions: tuple[type[Exception], ...] = (Exception,)


# Default policies per step type
DETERMINISTIC_POLICY = RetryPolicy(max_retries=2, delay_seconds=0.5)
AGENT_POLICY = RetryPolicy(max_retries=2, delay_seconds=2.0, backoff_multiplier=2.0)
EXTERNAL_ACTION_POLICY = RetryPolicy(max_retries=3, delay_seconds=1.0)
APPROVAL_POLICY = RetryPolicy(max_retries=0)  # No auto-retry for human steps


STEP_POLICIES: dict[str, RetryPolicy] = {
    "fetch_listings": RetryPolicy(max_retries=2, delay_seconds=1.0),
    "normalize_listings": DETERMINISTIC_POLICY,
    "deduplicate_listings": DETERMINISTIC_POLICY,
    "calculate_commutes": DETERMINISTIC_POLICY,
    "research_neighbourhoods": AGENT_POLICY,
    "calculate_deterministic_scores": DETERMINISTIC_POLICY,
    "generate_qualitative_evaluations": AGENT_POLICY,
    "build_shortlist": AGENT_POLICY,
    "draft_realtor_message": AGENT_POLICY,
    "create_pending_action": DETERMINISTIC_POLICY,
    "await_human_approval": APPROVAL_POLICY,
    "execute_approved_action": EXTERNAL_ACTION_POLICY,
    "finalize_workflow": DETERMINISTIC_POLICY,
}


def get_policy_for_step(step_name: str) -> RetryPolicy:
    return STEP_POLICIES.get(step_name, DETERMINISTIC_POLICY)

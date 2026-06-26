from __future__ import annotations

from relocation_scout.api.demo import get_failure_config, set_failure_injection
from relocation_scout.contracts.demo import DemoFailuresPatch
from relocation_scout.observability.events import AuditLogger
from relocation_scout.workflow.failure_injection import apply_demo_failures, reset_demo_failures
from relocation_scout.workflow.steps import WorkflowSteps


async def test_demo_failures_api_round_trip() -> None:
    reset_demo_failures()

    updated = await set_failure_injection(
        DemoFailuresPatch(
            commute_timeout=True,
            crash_after_email_send=True,
        )
    )

    assert updated.commute_timeout is True
    assert updated.crash_after_email_send is True
    assert updated.malformed_agent_output is False

    current = await get_failure_config()
    assert current == updated


async def test_apply_demo_failures_to_workflow_steps() -> None:
    reset_demo_failures()

    await set_failure_injection(
        DemoFailuresPatch(
            malformed_agent_output=True,
            neighbourhood_agent_failure=True,
            commute_timeout=True,
            crash_before_email_send=True,
        )
    )

    steps = WorkflowSteps(AuditLogger())
    apply_demo_failures(steps)

    assert steps._failure_injection["commute_timeout"] is True
    assert steps._failure_injection["crash_before_email_send"] is True
    assert steps.agent_runtime.fail_next is True
    assert steps.agent_runtime.return_malformed is True

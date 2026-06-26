from __future__ import annotations

from typing import Protocol

from relocation_scout.agents.mock_runtime import MockAgentRuntime
from relocation_scout.contracts.demo import DemoFailures, DemoFailuresPatch

_active_demo_failures = DemoFailures()


class FailureInjectableSteps(Protocol):
    _failure_injection: dict[str, bool]

    def set_failure_injection(self, step: str, enabled: bool = True) -> None: ...


def get_demo_failures() -> DemoFailures:
    return _active_demo_failures.model_copy(deep=True)


def reset_demo_failures() -> DemoFailures:
    global _active_demo_failures
    _active_demo_failures = DemoFailures()
    return get_demo_failures()


def update_demo_failures(patch: DemoFailuresPatch) -> DemoFailures:
    global _active_demo_failures
    current = _active_demo_failures.model_dump()
    for key, value in patch.model_dump().items():
        if value is not None:
            current[key] = value
    _active_demo_failures = DemoFailures(**current)
    return get_demo_failures()


def apply_demo_failures(steps: FailureInjectableSteps) -> None:
    failures = get_demo_failures()

    if hasattr(steps, "_failure_injection"):
        steps._failure_injection.clear()
        if failures.commute_timeout:
            steps.set_failure_injection("commute_timeout")
        if failures.crash_before_email_send:
            steps.set_failure_injection("crash_before_email_send")
        if failures.crash_after_email_send:
            steps.set_failure_injection("crash_after_email_send")

    agent_runtime = getattr(steps, "agent_runtime", None)
    if isinstance(agent_runtime, MockAgentRuntime):
        agent_runtime.fail_next = failures.neighbourhood_agent_failure
        agent_runtime.return_malformed = failures.malformed_agent_output

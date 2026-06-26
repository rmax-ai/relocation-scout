from __future__ import annotations

from pydantic import BaseModel


class DemoFailures(BaseModel):
    malformed_agent_output: bool = False
    neighbourhood_agent_failure: bool = False
    commute_timeout: bool = False
    crash_before_email_send: bool = False
    crash_after_email_send: bool = False
    duplicate_workflow_steps: bool = False
    prompt_injection_fixture: bool = False


class DemoFailuresPatch(BaseModel):
    malformed_agent_output: bool | None = None
    neighbourhood_agent_failure: bool | None = None
    commute_timeout: bool | None = None
    crash_before_email_send: bool | None = None
    crash_after_email_send: bool | None = None
    duplicate_workflow_steps: bool | None = None
    prompt_injection_fixture: bool | None = None

from __future__ import annotations

import asyncio


async def retry_with_policy(
    step_fn,
    policy,
    step_name: str,
    search_id: str,
):
    """Execute a step with retry policy."""
    last_error = None
    delay = policy.delay_seconds

    for attempt in range(policy.max_retries + 1):
        try:
            return await step_fn(), None, attempt
        except Exception as e:
            last_error = str(e)
            if attempt < policy.max_retries:
                await asyncio.sleep(delay)
                delay = min(delay * policy.backoff_multiplier, policy.max_delay_seconds)

    return None, last_error, policy.max_retries

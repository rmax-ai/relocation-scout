from __future__ import annotations

from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.persistence.database import async_session
from relocation_scout.workflow.controller import WorkflowController


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def get_workflow_controller(
    session: AsyncSession = Depends(get_session),
) -> WorkflowController:
    return WorkflowController(session)

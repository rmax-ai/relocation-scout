from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.persistence.repositories import (
    ApprovalDecisionRepository,
    AuditEventRepository,
    CommuteResultRepository,
    CompletedActionRepository,
    ListingEvaluationRepository,
    ListingRepository,
    NeighbourhoodAssessmentRepository,
    PendingActionRepository,
    SearchRepository,
    StepExecutionRepository,
    WorkflowRunRepository,
)


class UnitOfWork:
    """Transaction boundary for grouped persistence operations."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.searches = SearchRepository(session)
        self.workflow_runs = WorkflowRunRepository(session)
        self.step_executions = StepExecutionRepository(session)
        self.listings = ListingRepository(session)
        self.neighbourhood_assessments = NeighbourhoodAssessmentRepository(session)
        self.commute_results = CommuteResultRepository(session)
        self.listing_evaluations = ListingEvaluationRepository(session)
        self.pending_actions = PendingActionRepository(session)
        self.approval_decisions = ApprovalDecisionRepository(session)
        self.completed_actions = CompletedActionRepository(session)
        self.audit_events = AuditEventRepository(session)

    async def commit(self):
        await self.session.commit()

    async def rollback(self):
        await self.session.rollback()

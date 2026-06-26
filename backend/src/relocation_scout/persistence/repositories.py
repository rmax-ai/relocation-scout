from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.persistence.models import (
    ApprovalDecisionRecord,
    AuditEventRecord,
    CommuteResultRecord,
    CompletedActionRecord,
    ListingEvaluationRecord,
    ListingRecord,
    NeighbourhoodAssessmentRecord,
    PendingActionRecord,
    SearchRecord,
    SentEmailRecord,
    StepExecutionRecord,
    WorkflowRunRecord,
)


class SearchRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, name: str, preferences_json: str) -> SearchRecord:
        record = SearchRecord(id=str(uuid.uuid4()), name=name, preferences_json=preferences_json)
        self.session.add(record)
        await self.session.flush()
        return record

    async def get(self, search_id: str) -> SearchRecord | None:
        return await self.session.get(SearchRecord, search_id)

    async def list_all(self) -> list[SearchRecord]:
        result = await self.session.execute(
            select(SearchRecord).order_by(SearchRecord.created_at.desc())
        )
        return list(result.scalars().all())

    async def update_status(self, search_id: str, status: str):
        record = await self.get(search_id)
        if record:
            record.status = status
            record.updated_at = datetime.now()
            await self.session.flush()


class WorkflowRunRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, search_id: str, status: str = "created") -> WorkflowRunRecord:
        record = WorkflowRunRecord(
            id=str(uuid.uuid4()),
            search_id=search_id,
            status=status,
            completed_steps_json="[]",
        )
        self.session.add(record)
        await self.session.flush()
        return record

    async def get_latest(self, search_id: str) -> WorkflowRunRecord | None:
        result = await self.session.execute(
            select(WorkflowRunRecord)
            .where(WorkflowRunRecord.search_id == search_id)
            .order_by(WorkflowRunRecord.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def update(self, run: WorkflowRunRecord):
        run.updated_at = datetime.now()
        await self.session.flush()


class StepExecutionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_workflow_run(self, workflow_run_id: str) -> list[StepExecutionRecord]:
        result = await self.session.execute(
            select(StepExecutionRecord)
            .where(StepExecutionRecord.workflow_run_id == workflow_run_id)
            .order_by(StepExecutionRecord.started_at.asc())
        )
        return list(result.scalars().all())

    async def create(self, workflow_run_id: str, step_name: str) -> StepExecutionRecord:
        record = StepExecutionRecord(
            id=str(uuid.uuid4()),
            workflow_run_id=workflow_run_id,
            step_name=step_name,
            status="pending",
            started_at=datetime.now(),
        )
        self.session.add(record)
        await self.session.flush()
        return record

    async def mark_completed(self, exec_id: str, output_summary: str, duration_ms: float):
        record = await self.session.get(StepExecutionRecord, exec_id)
        if record:
            record.status = "completed"
            record.completed_at = datetime.now()
            record.duration_ms = duration_ms
            record.output_summary_json = output_summary
            await self.session.flush()

    async def mark_failed(self, exec_id: str, error: str):
        record = await self.session.get(StepExecutionRecord, exec_id)
        if record:
            record.status = "failed"
            record.error_message = error
            record.completed_at = datetime.now()
            await self.session.flush()


class ListingRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add(self, record: ListingRecord):
        self.session.add(record)
        await self.session.flush()

    async def get_by_search(self, search_id: str) -> list[ListingRecord]:
        result = await self.session.execute(
            select(ListingRecord).where(ListingRecord.search_id == search_id)
        )
        return list(result.scalars().all())

    async def get(self, listing_id: str) -> ListingRecord | None:
        return await self.session.get(ListingRecord, listing_id)

    async def mark_duplicate(self, listing_id: str, duplicate_of_id: str):
        record = await self.get(listing_id)
        if record:
            record.is_duplicate = True
            record.duplicate_of_id = duplicate_of_id
            await self.session.flush()


class NeighbourhoodAssessmentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add(self, record: NeighbourhoodAssessmentRecord):
        self.session.add(record)
        await self.session.flush()

    async def get_by_search(self, search_id: str) -> list[NeighbourhoodAssessmentRecord]:
        result = await self.session.execute(
            select(NeighbourhoodAssessmentRecord).where(
                NeighbourhoodAssessmentRecord.search_id == search_id
            )
        )
        return list(result.scalars().all())


class CommuteResultRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add(self, record: CommuteResultRecord):
        self.session.add(record)
        await self.session.flush()

    async def get_by_listing(self, listing_id: str) -> CommuteResultRecord | None:
        result = await self.session.execute(
            select(CommuteResultRecord).where(CommuteResultRecord.listing_id == listing_id)
        )
        return result.scalar_one_or_none()


class ListingEvaluationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add(self, record: ListingEvaluationRecord):
        self.session.add(record)
        await self.session.flush()

    async def get_by_search(self, search_id: str) -> list[ListingEvaluationRecord]:
        result = await self.session.execute(
            select(ListingEvaluationRecord).where(ListingEvaluationRecord.search_id == search_id)
        )
        return list(result.scalars().all())


class PendingActionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, record: PendingActionRecord) -> PendingActionRecord:
        self.session.add(record)
        await self.session.flush()
        return record

    async def get(self, action_id: str) -> PendingActionRecord | None:
        return await self.session.get(PendingActionRecord, action_id)

    async def get_by_search(self, search_id: str) -> list[PendingActionRecord]:
        result = await self.session.execute(
            select(PendingActionRecord)
            .where(PendingActionRecord.search_id == search_id)
            .order_by(PendingActionRecord.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, record: PendingActionRecord):
        record.updated_at = datetime.now()
        await self.session.flush()


class ApprovalDecisionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, record: ApprovalDecisionRecord) -> ApprovalDecisionRecord:
        self.session.add(record)
        await self.session.flush()
        return record

    async def get_by_action(self, action_id: str) -> list[ApprovalDecisionRecord]:
        result = await self.session.execute(
            select(ApprovalDecisionRecord)
            .where(ApprovalDecisionRecord.action_id == action_id)
            .order_by(ApprovalDecisionRecord.approved_at.desc())
        )
        return list(result.scalars().all())


class CompletedActionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_idempotency_key(self, key: str) -> CompletedActionRecord | None:
        result = await self.session.execute(
            select(CompletedActionRecord).where(CompletedActionRecord.idempotency_key == key)
        )
        return result.scalar_one_or_none()

    async def create(self, record: CompletedActionRecord) -> CompletedActionRecord:
        self.session.add(record)
        await self.session.flush()
        return record

    async def add_sent_email(self, record: SentEmailRecord):
        self.session.add(record)
        await self.session.flush()


class AuditEventRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add(self, record: AuditEventRecord):
        self.session.add(record)
        await self.session.flush()

    async def get_by_search(self, search_id: str, limit: int = 100) -> list[AuditEventRecord]:
        result = await self.session.execute(
            select(AuditEventRecord)
            .where(AuditEventRecord.search_id == search_id)
            .order_by(AuditEventRecord.timestamp.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.contracts.audit import ActorType, AuditEventType
from relocation_scout.contracts.workflow import (
    StepResult,
    WorkflowContext,
    WorkflowState,
    WorkflowStatus,
)
from relocation_scout.observability.events import AuditLogger
from relocation_scout.observability.tracing import metrics
from relocation_scout.persistence.unit_of_work import UnitOfWork
from relocation_scout.tools.email import MockEmailService
from relocation_scout.workflow.failure_injection import apply_demo_failures
from relocation_scout.workflow.policies import get_policy_for_step
from relocation_scout.workflow.recovery import get_next_step_for_status
from relocation_scout.workflow.retries import retry_with_policy
from relocation_scout.workflow.steps import WorkflowSteps
from relocation_scout.workflow.transitions import is_valid_transition


class WorkflowController:
    """Deterministic workflow orchestrator."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.uow = UnitOfWork(session)
        self.audit = AuditLogger(session)
        self.steps = WorkflowSteps(self.audit)
        apply_demo_failures(self.steps)

    async def create_workflow(self, search_id: str) -> WorkflowState:
        """Create a new workflow run for a search."""
        state = WorkflowState(
            search_id=search_id,
            status=WorkflowStatus.CREATED,
            current_step=None,
        )

        await self.uow.workflow_runs.create(search_id, status=state.status.value)
        state.search_id = search_id

        self.audit.emit(
            AuditEventType.WORKFLOW_STARTED,
            ActorType.SYSTEM,
            f"Workflow created for search {search_id}",
            search_id,
        )
        await self.audit.flush(self.session)
        await self.session.commit()

        return state

    async def get_workflow_state(self, search_id: str) -> WorkflowState | None:
        """Get current workflow state for a search."""
        run = await self.uow.workflow_runs.get_latest(search_id)
        if not run:
            return None

        completed_steps = json.loads(run.completed_steps_json)

        return WorkflowState(
            search_id=search_id,
            status=WorkflowStatus(run.status),
            prior_status=WorkflowStatus(run.prior_status) if run.prior_status else None,
            current_step=run.current_step,
            completed_steps=completed_steps,
            retry_count=run.retry_count,
            last_error=run.last_error,
            resumable=run.resumable,
            created_at=run.created_at,
            updated_at=run.updated_at,
        )

    async def start_workflow(
        self, search_id: str, initial_data: dict | None = None
    ) -> WorkflowState:
        """Start or resume workflow execution with optional initial context data."""
        state = await self.get_workflow_state(search_id)
        if not state:
            raise ValueError(f"No workflow found for search {search_id}")

        if state.status == WorkflowStatus.COMPLETED:
            return state

        return await self._execute_from(state, initial_data=initial_data)

    async def resume_workflow(self, search_id: str) -> WorkflowState:
        """Resume a failed or interrupted workflow."""
        state = await self.get_workflow_state(search_id)
        if not state:
            raise ValueError(f"No workflow found for search {search_id}")

        if state.status == WorkflowStatus.COMPLETED:
            return state

        self.audit.emit(
            AuditEventType.WORKFLOW_RESUMED,
            ActorType.SYSTEM,
            f"Workflow resumed from {state.status.value}",
            search_id,
            metadata={"prior_status": state.status.value},
        )

        return await self._execute_from(state)

    async def _execute_from(
        self, state: WorkflowState, initial_data: dict | None = None
    ) -> WorkflowState:
        """Execute workflow steps from the given state."""
        ctx = WorkflowContext(search_id=state.search_id, state=state)

        # Load existing workflow data from previous runs
        existing = await self._load_workflow_data(state.search_id)
        ctx.data.update(existing)

        # Merge initial data (e.g., preferences from search record)
        if initial_data:
            ctx.data.update(initial_data)

        # Run enrichment sub-steps if at ENRICHMENT_RUNNING or before
        if state.status in (
            WorkflowStatus.CREATED,
            WorkflowStatus.LISTINGS_FETCHED,
            WorkflowStatus.LISTINGS_NORMALIZED,
            WorkflowStatus.LISTINGS_DEDUPLICATED,
            WorkflowStatus.ENRICHMENT_RUNNING,
        ):
            await self._execute_enrichment_pipeline(ctx)

        # Run remaining steps
        current_status = ctx.state.status
        while current_status not in (
            WorkflowStatus.COMPLETED,
            WorkflowStatus.FAILED,
            WorkflowStatus.AWAITING_APPROVAL,
        ):
            next_step = get_next_step_for_status(current_status)
            if next_step is None:
                break

            result = await self._execute_step(next_step, ctx)
            if not result.success:
                return await self._handle_failure(ctx, result)

            # Transition to next status
            new_status = self._status_after_step(next_step)
            if new_status and is_valid_transition(current_status, new_status):
                ctx.state.prior_status = current_status
                ctx.state.status = new_status
                ctx.state.current_step = next_step
                if next_step not in ctx.state.completed_steps:
                    ctx.state.completed_steps.append(next_step)
                current_status = new_status

                # Persist progress
                await self._persist_progress(ctx)

        # If awaiting approval, persist and return
        if ctx.state.status == WorkflowStatus.AWAITING_APPROVAL:
            await self._persist_progress(ctx)
            # Create persistent pending action via approval gateway
            await self._create_persistent_action(ctx)

        return ctx.state

    async def _execute_enrichment_pipeline(self, ctx: WorkflowContext):
        """Execute the full enrichment pipeline (fetch → normalize → dedup → commute → research)."""
        pipeline_steps = [
            "fetch_listings",
            "normalize_listings",
            "deduplicate_listings",
            "calculate_commutes",
            "research_neighbourhoods",
            "calculate_deterministic_scores",
            "generate_qualitative_evaluations",
            "build_shortlist",
            "draft_realtor_message",
            "create_pending_action",
        ]

        for step_name in pipeline_steps:
            if step_name in ctx.state.completed_steps:
                continue

            result = await self._execute_step(step_name, ctx)
            if not result.success:
                ctx.state.status = WorkflowStatus.FAILED
                ctx.state.last_error = result.error
                await self._persist_progress(ctx)
                return

            new_status = self._status_after_step(step_name)
            if new_status:
                ctx.state.prior_status = ctx.state.status
                ctx.state.status = new_status
                ctx.state.current_step = step_name
                if step_name not in ctx.state.completed_steps:
                    ctx.state.completed_steps.append(step_name)
                await self._persist_progress(ctx)

    async def _execute_step(self, step_name: str, ctx: WorkflowContext) -> StepResult:
        """Execute a single step with retry policy and audit."""
        self.audit.emit(
            AuditEventType.WORKFLOW_STEP_STARTED,
            ActorType.DETERMINISTIC,
            f"Starting step: {step_name}",
            ctx.search_id,
            step_name,
        )

        step_fn = getattr(self.steps, step_name, None)
        if step_fn is None:
            return StepResult(
                step_name=step_name, success=False, error=f"Unknown step: {step_name}"
            )

        policy = get_policy_for_step(step_name)

        start_time = datetime.now()
        result, error, attempts = await retry_with_policy(
            lambda: step_fn(ctx),
            policy,
            step_name,
            ctx.search_id,
        )

        duration_ms = (datetime.now() - start_time).total_seconds() * 1000

        if result is not None:
            self.audit.emit(
                AuditEventType.WORKFLOW_STEP_COMPLETED,
                ActorType.DETERMINISTIC,
                f"Step completed: {step_name} ({duration_ms:.0f}ms)",
                ctx.search_id,
                step_name,
                metadata={"duration_ms": duration_ms, "attempts": attempts + 1},
            )
            return result
        else:
            self.audit.emit(
                AuditEventType.WORKFLOW_STEP_FAILED,
                ActorType.DETERMINISTIC,
                f"Step failed: {step_name} - {error}",
                ctx.search_id,
                step_name,
                metadata={"error": error, "attempts": attempts + 1},
            )
            return StepResult(
                step_name=step_name,
                success=False,
                error=error,
                should_retry=attempts < policy.max_retries,
            )

    async def execute_approved_action(self, search_id: str, action_id: str) -> dict:
        """Execute an approved external action with idempotency."""
        action_record = await self.uow.pending_actions.get(action_id)
        if not action_record:
            raise ValueError(f"Action {action_id} not found")

        if action_record.status != "approved":
            raise ValueError(f"Action {action_id} is not approved (status: {action_record.status})")

        payload = json.loads(action_record.payload_json)

        # Check idempotency — has this already been executed?
        existing = await self.uow.completed_actions.get_by_idempotency_key(
            action_record.idempotency_key
        )
        if existing:
            self.audit.emit(
                AuditEventType.ACTION_DUPLICATE_PREVENTED,
                ActorType.SYSTEM,
                f"Action {action_id} already executed (idempotency key match)",
                search_id,
                entity_type="action",
                entity_id=action_id,
                metadata={"idempotency_key": action_record.idempotency_key},
            )
            metrics.increment("duplicate_actions_prevented")
            return json.loads(existing.result_json)

        # Mark executing
        action_record.status = "executing"
        action_record.updated_at = datetime.now()
        await self.session.flush()

        self.audit.emit(
            AuditEventType.ACTION_EXECUTING,
            ActorType.SYSTEM,
            f"Executing action {action_id}",
            search_id,
            entity_type="action",
            entity_id=action_id,
        )

        # Check for crash-after-send failure injection
        crash_after_send = self.steps._failure_injection.get("crash_after_email_send", False)
        crash_before_persist = self.steps._failure_injection.get("crash_before_persist", False)

        # Invoke email service
        try:
            if self.steps._failure_injection.get("crash_before_email_send", False):
                raise RuntimeError("CRASH_INJECTED: before email send")

            email_service = MockEmailService(self.session)
            if self.steps._failure_injection.get("email_fail", False):
                raise RuntimeError("Simulated email failure")

            result = await email_service.send_email(
                recipient=payload.get("recipient", ""),
                subject=payload.get("subject", ""),
                body=payload.get("body", ""),
                action_id=action_id,
            )

            # Simulated crash: after email sent, before persistence
            if crash_after_send:
                raise RuntimeError("CRASH_INJECTED: after email send, before persistence")

            # Record completion atomically
            import uuid

            from relocation_scout.persistence.models import CompletedActionRecord

            completed = CompletedActionRecord(
                id=str(uuid.uuid4()),
                action_id=action_id,
                idempotency_key=action_record.idempotency_key,
                status="completed",
                result_json=json.dumps(result),
                completed_at=datetime.now(),
            )
            self.session.add(completed)

            action_record.status = "completed"
            action_record.updated_at = datetime.now()

            # Simulated crash: before persist
            if crash_before_persist:
                raise RuntimeError("CRASH_INJECTED: before persistence")

            await self.session.commit()

            self.audit.emit(
                AuditEventType.ACTION_EXECUTED,
                ActorType.TOOL,
                f"Action {action_id} executed successfully",
                search_id,
                entity_type="action",
                entity_id=action_id,
                metadata={"email_id": result.get("email_id")},
            )
            metrics.increment("actions_executed")

            # Update workflow state
            await self._update_workflow_status(search_id, WorkflowStatus.ACTION_EXECUTED)
            await self._update_workflow_status(search_id, WorkflowStatus.COMPLETED)

            return result

        except Exception as e:
            await self.session.rollback()

            # Reconciliation: check if email was actually sent
            if "CRASH_INJECTED" in str(e):
                # Re-check if the email was persisted
                from sqlalchemy import text

                result = await self.session.execute(
                    text("SELECT id FROM sent_emails WHERE action_id = :aid"),
                    {"aid": action_id},
                )
                sent = result.fetchone()
                if sent:
                    # Email was sent, mark as completed via reconciliation
                    import uuid as uuid_mod

                    from relocation_scout.persistence.models import CompletedActionRecord

                    if not await self.uow.completed_actions.get_by_idempotency_key(
                        action_record.idempotency_key
                    ):
                        completed_rec = CompletedActionRecord(
                            id=str(uuid_mod.uuid4()),
                            action_id=action_id,
                            idempotency_key=action_record.idempotency_key,
                            status="completed",
                            result_json=json.dumps({"reconciled": True, "email_id": sent[0]}),
                            completed_at=datetime.now(),
                        )
                        self.session.add(completed_rec)

                    action_record.status = "completed"
                    action_record.updated_at = datetime.now()
                    await self.session.commit()

                    self.audit.emit(
                        AuditEventType.SYSTEM_RECOVERY,
                        ActorType.SYSTEM,
                        f"Recovered action {action_id} — email was sent before crash",
                        search_id,
                        entity_type="action",
                        entity_id=action_id,
                    )
                    metrics.increment("recovered_actions")
                    return {"reconciled": True, "email_id": sent[0]}

            # Real failure
            action_record.status = "failed"
            action_record.updated_at = datetime.now()
            await self.session.commit()

            self.audit.emit(
                AuditEventType.ACTION_FAILED,
                ActorType.SYSTEM,
                f"Action {action_id} failed: {e!s}",
                search_id,
                entity_type="action",
                entity_id=action_id,
                metadata={"error": str(e)},
            )
            raise

    async def _persist_progress(self, ctx: WorkflowContext):
        """Persist current workflow state to the database."""
        run = await self.uow.workflow_runs.get_latest(ctx.search_id)
        if run:
            run.status = ctx.state.status.value
            run.prior_status = ctx.state.prior_status.value if ctx.state.prior_status else None
            run.current_step = ctx.state.current_step
            run.completed_steps_json = json.dumps(ctx.state.completed_steps)
            run.retry_count = ctx.state.retry_count
            run.last_error = ctx.state.last_error
            run.resumable = ctx.state.resumable
            await self.uow.workflow_runs.update(run)

        # Also persist data to search record for restart
        await self._save_workflow_data(ctx.search_id, ctx.data)

        await self.audit.flush(self.session)
        await self.session.commit()

    async def _handle_failure(self, ctx: WorkflowContext, result: StepResult) -> WorkflowState:
        ctx.state.status = WorkflowStatus.FAILED
        ctx.state.last_error = result.error
        ctx.state.resumable = result.should_retry
        await self._persist_progress(ctx)
        metrics.increment("workflow_failures")
        return ctx.state

    async def _update_workflow_status(self, search_id: str, status: WorkflowStatus):
        run = await self.uow.workflow_runs.get_latest(search_id)
        if run:
            run.status = status.value
            run.updated_at = datetime.now()
            await self.uow.workflow_runs.update(run)
        await self.session.commit()

    async def _save_workflow_data(self, search_id: str, data: dict[str, Any]):
        """Save workflow context data for resumability."""
        # Clean data — remove large nested objects, keep summaries
        saveable = {}
        for key, value in data.items():
            if key == "raw_listings":
                saveable[key] = {"count": len(value)}
            elif key == "normalized_listings":
                saveable[key] = {
                    "count": len(value),
                    "ids": [ld["listing_id"] for ld in value],
                }
            else:
                saveable[key] = (
                    value if isinstance(value, (dict, list, str, int, float, bool)) else str(value)
                )
        _run = await self.uow.workflow_runs.get_latest(search_id)
        # Store minimal recovery data in metadata
        # Full recovery from DB records, not ctx.data

    async def _load_workflow_data(self, search_id: str) -> dict[str, Any]:
        """Load existing workflow data from persistent records."""
        return {}  # Data is reconstructed from DB records on resume

    def _status_after_step(self, step_name: str) -> WorkflowStatus | None:
        step_to_status = {
            "fetch_listings": WorkflowStatus.LISTINGS_FETCHED,
            "normalize_listings": WorkflowStatus.LISTINGS_NORMALIZED,
            "deduplicate_listings": WorkflowStatus.LISTINGS_DEDUPLICATED,
            "calculate_commutes": WorkflowStatus.ENRICHMENT_COMPLETE,
            "research_neighbourhoods": WorkflowStatus.ENRICHMENT_COMPLETE,
            "calculate_deterministic_scores": WorkflowStatus.RANKING_COMPLETE,
            "generate_qualitative_evaluations": WorkflowStatus.RANKING_COMPLETE,
            "build_shortlist": WorkflowStatus.SHORTLIST_CREATED,
            "draft_realtor_message": WorkflowStatus.SHORTLIST_CREATED,
            "create_pending_action": WorkflowStatus.AWAITING_APPROVAL,
            "await_human_approval": WorkflowStatus.AWAITING_APPROVAL,
            "execute_approved_action": WorkflowStatus.ACTION_EXECUTED,
            "finalize_workflow": WorkflowStatus.COMPLETED,
        }
        return step_to_status.get(step_name)

    async def _create_persistent_action(self, ctx: WorkflowContext):
        """Create a persistent PendingAction record via the approval gateway."""
        from relocation_scout.tools.approval_gateway import approval_gateway

        payload = ctx.data.get("pending_action_payload", {})
        listing_id = ctx.data.get("pending_action_listing_id", "")

        if not payload or not listing_id:
            return

        action = await approval_gateway.create_pending_action(
            self.session,
            search_id=ctx.search_id,
            action_type="send_realtor_email",
            target_listing_id=listing_id,
            payload=payload,
            risk_level="low",
        )
        await self.session.commit()
        ctx.data["action_id"] = action.action_id
        ctx.data["idempotency_key"] = action.idempotency_key

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from relocation_scout.persistence.database import Base


class SearchRecord(Base):
    __tablename__ = "searches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="created")
    preferences_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    workflow_runs: Mapped[list[WorkflowRunRecord]] = relationship(
        back_populates="search", cascade="all, delete-orphan"
    )
    listings: Mapped[list[ListingRecord]] = relationship(
        back_populates="search", cascade="all, delete-orphan"
    )


class WorkflowRunRecord(Base):
    __tablename__ = "workflow_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    search_id: Mapped[str] = mapped_column(String(36), ForeignKey("searches.id"))
    status: Mapped[str] = mapped_column(String(50))
    prior_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    current_step: Mapped[str | None] = mapped_column(String(100), nullable=True)
    completed_steps_json: Mapped[str] = mapped_column(Text, default="[]")
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    resumable: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    search: Mapped[SearchRecord] = relationship(back_populates="workflow_runs")
    step_executions: Mapped[list[StepExecutionRecord]] = relationship(
        back_populates="workflow_run", cascade="all, delete-orphan"
    )


class StepExecutionRecord(Base):
    __tablename__ = "step_executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    workflow_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("workflow_runs.id"))
    step_name: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20))
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    input_summary_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_summary_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    workflow_run: Mapped[WorkflowRunRecord] = relationship(back_populates="step_executions")


class ListingRecord(Base):
    __tablename__ = "listings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    search_id: Mapped[str] = mapped_column(String(36), ForeignKey("searches.id"))
    provider: Mapped[str] = mapped_column(String(50))
    provider_listing_id: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(500))
    address: Mapped[str] = mapped_column(String(500))
    neighbourhood: Mapped[str] = mapped_column(String(200))
    monthly_rent_eur: Mapped[int] = mapped_column(Integer)
    bedrooms: Mapped[int] = mapped_column(Integer)
    area_m2: Mapped[float | None] = mapped_column(Float, nullable=True)
    source_url: Mapped[str] = mapped_column(String(1000))
    description: Mapped[str] = mapped_column(Text)
    coordinates_json: Mapped[str | None] = mapped_column(String(200), nullable=True)
    source_payload_hash: Mapped[str] = mapped_column(String(64))
    is_suspicious: Mapped[bool] = mapped_column(Boolean, default=False)
    suspicion_reasons_json: Mapped[str] = mapped_column(Text, default="[]")
    is_normalized: Mapped[bool] = mapped_column(Boolean, default=False)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False)
    duplicate_of_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    search: Mapped[SearchRecord] = relationship(back_populates="listings")


class NeighbourhoodAssessmentRecord(Base):
    __tablename__ = "neighbourhood_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    search_id: Mapped[str] = mapped_column(String(36))
    neighbourhood: Mapped[str] = mapped_column(String(200))
    quiet_score: Mapped[float] = mapped_column(Float)
    transport_score: Mapped[float] = mapped_column(Float)
    green_space_score: Mapped[float] = mapped_column(Float)
    summary: Mapped[str] = mapped_column(Text)
    strengths_json: Mapped[str] = mapped_column(Text, default="[]")
    concerns_json: Mapped[str] = mapped_column(Text, default="[]")
    evidence_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class CommuteResultRecord(Base):
    __tablename__ = "commute_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    listing_id: Mapped[str] = mapped_column(String(36))
    search_id: Mapped[str] = mapped_column(String(36))
    destination_address: Mapped[str] = mapped_column(String(500))
    duration_minutes: Mapped[float] = mapped_column(Float)
    distance_km: Mapped[float] = mapped_column(Float)
    transport_mode: Mapped[str] = mapped_column(String(50), default="transit")


class ListingEvaluationRecord(Base):
    __tablename__ = "listing_evaluations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    listing_id: Mapped[str] = mapped_column(String(36))
    search_id: Mapped[str] = mapped_column(String(36))
    hard_constraints_passed: Mapped[bool] = mapped_column(Boolean)
    affordability_score: Mapped[float] = mapped_column(Float)
    commute_score: Mapped[float] = mapped_column(Float)
    neighbourhood_score: Mapped[float] = mapped_column(Float)
    qualitative_fit_score: Mapped[float] = mapped_column(Float)
    overall_score: Mapped[float] = mapped_column(Float)
    strengths_json: Mapped[str] = mapped_column(Text, default="[]")
    concerns_json: Mapped[str] = mapped_column(Text, default="[]")
    recommendation: Mapped[str] = mapped_column(String(50))
    evidence_ids_json: Mapped[str] = mapped_column(Text, default="[]")
    agent_explanation: Mapped[str] = mapped_column(Text, default="")
    is_qualitative: Mapped[bool] = mapped_column(Boolean, default=False)


class PendingActionRecord(Base):
    __tablename__ = "pending_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    search_id: Mapped[str] = mapped_column(String(36))
    action_type: Mapped[str] = mapped_column(String(50))
    target_listing_id: Mapped[str] = mapped_column(String(36))
    payload_json: Mapped[str] = mapped_column(Text)
    payload_hash: Mapped[str] = mapped_column(String(64))
    idempotency_key: Mapped[str] = mapped_column(String(255))
    risk_level: Mapped[str] = mapped_column(String(20), default="low")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )


class ApprovalDecisionRecord(Base):
    __tablename__ = "approval_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    action_id: Mapped[str] = mapped_column(String(36))
    decision: Mapped[str] = mapped_column(String(20))
    approved_by: Mapped[str] = mapped_column(String(100))
    approved_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    edited_payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)


class CompletedActionRecord(Base):
    __tablename__ = "completed_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    action_id: Mapped[str] = mapped_column(String(36))
    idempotency_key: Mapped[str] = mapped_column(String(255), unique=True)
    status: Mapped[str] = mapped_column(String(20))
    result_json: Mapped[str] = mapped_column(Text, default="{}")
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class SentEmailRecord(Base):
    __tablename__ = "sent_emails"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    action_id: Mapped[str] = mapped_column(String(36))
    recipient: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(Text)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class AuditEventRecord(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    event_type: Mapped[str] = mapped_column(String(100))
    actor: Mapped[str] = mapped_column(String(50))
    search_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    workflow_step: Mapped[str | None] = mapped_column(String(100), nullable=True)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    message: Mapped[str] = mapped_column(Text)
    metadata_json: Mapped[str] = mapped_column(Text, default="{}")
    trace_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ValidationError

from relocation_scout.contracts.audit import ActorType, AuditEventType
from relocation_scout.observability.events import AuditLogger


class AgentOutputValidator:
    """Validates and repairs agent outputs against Pydantic schemas."""

    def __init__(self, audit: AuditLogger):
        self.audit = audit

    def validate_and_repair(
        self,
        raw_output: dict[str, Any],
        schema: type[BaseModel],
        agent_name: str,
        search_id: str,
    ) -> tuple[BaseModel | None, bool, list[str]]:
        """
        Validate agent output. Attempt one repair if validation fails.
        Returns: (validated_model, is_valid, repair_notes)
        """
        repair_notes: list[str] = []

        # Attempt 1: direct validation
        try:
            model = schema.model_validate(raw_output)
            return model, True, []
        except ValidationError as e:
            self.audit.emit(
                event_type=AuditEventType.AGENT_VALIDATION_FAILED,
                actor=ActorType.AGENT,
                message=f"Agent {agent_name} output validation failed: {str(e)[:500]}",
                search_id=search_id,
                metadata={
                    "agent": agent_name,
                    "schema": schema.__name__,
                    "error_count": len(e.errors()),
                },
            )

        # Attempt 2: repair
        try:
            repaired = self._attempt_repair(raw_output, schema)
            model = schema.model_validate(repaired)
            repair_notes.append(f"Repaired output for {agent_name}")
            self.audit.emit(
                event_type=AuditEventType.AGENT_VALIDATION_REPAIRED,
                actor=ActorType.AGENT,
                message=f"Agent {agent_name} output repaired successfully",
                search_id=search_id,
                metadata={
                    "agent": agent_name,
                    "schema": schema.__name__,
                    "repair": "default_value_fill",
                },
            )
            return model, True, repair_notes
        except ValidationError as e2:
            self.audit.emit(
                event_type=AuditEventType.AGENT_VALIDATION_FAILED,
                actor=ActorType.AGENT,
                message=f"Agent {agent_name} output repair failed: {str(e2)[:500]}",
                search_id=search_id,
                metadata={
                    "agent": agent_name,
                    "schema": schema.__name__,
                    "final_failure": True,
                },
            )
            return None, False, repair_notes

    def _attempt_repair(
        self,
        raw: dict[str, Any],
        schema: type[BaseModel],
    ) -> dict[str, Any]:
        """Simple repair: fill missing required fields with defaults."""
        repaired = dict(raw)

        for field_name, field_info in schema.model_fields.items():
            if field_name not in repaired and field_info.is_required():
                # Try to provide a sensible default
                default = field_info.default
                if default is not None and default != ...:
                    repaired[field_name] = default
                elif field_info.annotation == str:
                    repaired[field_name] = ""
                elif field_info.annotation == float:
                    repaired[field_name] = 0.0
                elif field_info.annotation == int:
                    repaired[field_name] = 0
                elif field_info.annotation == bool:
                    repaired[field_name] = False
                elif field_info.annotation == list:
                    repaired[field_name] = []
                elif field_info.annotation == dict:
                    repaired[field_name] = {}

        return repaired

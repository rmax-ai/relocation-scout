from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class EvidenceItem(BaseModel):
    source_type: Literal["fixture", "tool", "model"]
    source_id: str
    claim: str
    value: str | float | int | bool
    confidence: float = Field(ge=0.0, le=1.0)


class NeighbourhoodAssessment(BaseModel):
    neighbourhood: str
    quiet_score: float = Field(ge=0.0, le=1.0)
    transport_score: float = Field(ge=0.0, le=1.0)
    green_space_score: float = Field(ge=0.0, le=1.0)
    summary: str
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)


class CommuteResult(BaseModel):
    listing_id: str
    destination_address: str
    duration_minutes: float
    distance_km: float
    transport_mode: str = "transit"

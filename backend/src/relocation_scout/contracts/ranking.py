from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

RecommendationLevel = Literal["strong_match", "possible_match", "weak_match", "reject"]


class ListingEvaluation(BaseModel):
    listing_id: str
    hard_constraints_passed: bool
    affordability_score: float = Field(ge=0.0, le=1.0)
    commute_score: float = Field(ge=0.0, le=1.0)
    neighbourhood_score: float = Field(ge=0.0, le=1.0)
    qualitative_fit_score: float = Field(ge=0.0, le=1.0)
    overall_score: float = Field(ge=0.0, le=1.0)
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    recommendation: RecommendationLevel
    evidence_ids: list[str] = Field(default_factory=list)
    agent_explanation: str = ""
    is_qualitative: bool = False

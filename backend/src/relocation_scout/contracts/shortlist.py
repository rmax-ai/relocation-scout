from __future__ import annotations

from pydantic import BaseModel, Field

from relocation_scout.contracts.ranking import ListingEvaluation


class ShortlistEntry(BaseModel):
    rank: int
    listing_id: str
    title: str
    address: str
    neighbourhood: str
    monthly_rent_eur: int
    commute_minutes: float
    overall_score: float
    evaluation: ListingEvaluation
    selected: bool = False


class Shortlist(BaseModel):
    search_id: str
    entries: list[ShortlistEntry] = Field(default_factory=list)
    summary: str = ""
    comparison_notes: str = ""

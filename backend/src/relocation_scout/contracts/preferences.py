from __future__ import annotations

from pydantic import BaseModel, Field, model_validator


class PriorityWeights(BaseModel):
    quiet: float = 0.25
    transport: float = 0.25
    green_space: float = 0.25
    affordability: float = 0.25

    @model_validator(mode="after")
    def validate_sum(self) -> PriorityWeights:
        total = self.quiet + self.transport + self.green_space + self.affordability
        if abs(total - 1.0) > 0.001:
            raise ValueError("Priority weights must sum to 1.0")
        return self


class HousingPreferences(BaseModel):
    max_monthly_rent_eur: int
    minimum_bedrooms: int
    minimum_area_m2: float | None = None
    max_commute_minutes: int
    destination_address: str
    preferred_neighbourhoods: list[str] = Field(default_factory=list)
    excluded_neighbourhoods: list[str] = Field(default_factory=list)
    priorities: PriorityWeights = Field(default_factory=PriorityWeights)
    free_text_preferences: str | None = None

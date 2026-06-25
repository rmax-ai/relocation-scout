from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    lat: float
    lng: float


class Listing(BaseModel):
    listing_id: str
    provider: str
    provider_listing_id: str
    title: str
    address: str
    neighbourhood: str
    monthly_rent_eur: int
    bedrooms: int
    area_m2: float | None = None
    source_url: str
    description: str
    coordinates: Coordinates | None = None
    fetched_at: datetime = Field(default_factory=lambda: datetime.now())


class NormalizedListing(Listing):
    source_payload_hash: str
    is_suspicious: bool = False
    suspicion_reasons: list[str] = Field(default_factory=list)


class ListingProvider(str):
    """Known listing providers."""

    FUNDA = "funda"
    PARARIUS = "pararius"
    HUURWONINGEN = "huurwoningen"
    JAAP = "jaap"


class ListingSource(BaseModel):
    """Metadata about where a listing came from."""

    provider: str
    provider_listing_id: str
    raw_payload_hash: str
    fetched_at: datetime = Field(default_factory=lambda: datetime.now())

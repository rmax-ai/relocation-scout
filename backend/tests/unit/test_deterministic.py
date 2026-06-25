from __future__ import annotations

from relocation_scout.contracts.listing import NormalizedListing
from relocation_scout.contracts.preferences import HousingPreferences, PriorityWeights
from relocation_scout.contracts.research import CommuteResult
from relocation_scout.deterministic.filtering import check_hard_constraints
from relocation_scout.deterministic.scoring import calculate_deterministic_scores


def make_listing(**overrides):
    defaults = {
        "listing_id": "test-1",
        "provider": "test",
        "provider_listing_id": "1",
        "title": "Test",
        "address": "Test St",
        "neighbourhood": "West",
        "monthly_rent_eur": 1500,
        "bedrooms": 2,
        "area_m2": 70.0,
        "source_url": "http://x.com",
        "description": "Test",
        "source_payload_hash": "abc",
    }
    defaults.update(overrides)
    return NormalizedListing(**defaults)


def make_preferences(**overrides):
    defaults = {
        "max_monthly_rent_eur": 2000,
        "minimum_bedrooms": 2,
        "max_commute_minutes": 30,
        "destination_address": "Amsterdam Centraal",
        "priorities": PriorityWeights(
            quiet=0.3, transport=0.25, green_space=0.2, affordability=0.25
        ),
    }
    defaults.update(overrides)
    return HousingPreferences(**defaults)


class TestHardConstraints:
    def test_over_budget_rejected(self):
        listing = make_listing(monthly_rent_eur=2500)
        prefs = make_preferences(max_monthly_rent_eur=2000)
        passed, failures = check_hard_constraints(listing, prefs)
        assert not passed
        assert any("Rent" in f for f in failures)

    def test_under_budget_accepted(self):
        listing = make_listing(monthly_rent_eur=1500)
        prefs = make_preferences(max_monthly_rent_eur=2000)
        passed, _ = check_hard_constraints(listing, prefs)
        assert passed

    def test_too_few_bedrooms_rejected(self):
        listing = make_listing(bedrooms=1)
        prefs = make_preferences(minimum_bedrooms=2)
        passed, failures = check_hard_constraints(listing, prefs)
        assert not passed

    def test_excessive_commute_rejected(self):
        listing = make_listing()
        prefs = make_preferences(max_commute_minutes=30)
        commute = CommuteResult(
            listing_id="test-1", destination_address="A", duration_minutes=45.0, distance_km=15.0
        )
        passed, failures = check_hard_constraints(listing, prefs, commute)
        assert not passed

    def test_excluded_neighbourhood_rejected(self):
        listing = make_listing(neighbourhood="Noord")
        prefs = make_preferences(excluded_neighbourhoods=["Noord"])
        passed, failures = check_hard_constraints(listing, prefs)
        assert not passed

    def test_all_constraints_passed(self):
        listing = make_listing(monthly_rent_eur=1500, bedrooms=2, neighbourhood="West")
        prefs = make_preferences()
        commute = CommuteResult(
            listing_id="test-1", destination_address="A", duration_minutes=20.0, distance_km=5.0
        )
        passed, failures = check_hard_constraints(listing, prefs, commute)
        assert passed


class TestDeterministicScoring:
    def test_hard_constraints_failed_is_reject(self):
        listing = make_listing()
        prefs = make_preferences()
        commute = CommuteResult(
            listing_id="test-1", destination_address="A", duration_minutes=20.0, distance_km=5.0
        )
        evaluation = calculate_deterministic_scores(listing, prefs, commute, None, False)
        assert evaluation.recommendation == "reject"
        assert evaluation.hard_constraints_passed is False

    def test_affordability_scoring(self):
        listing = make_listing(monthly_rent_eur=1000)
        prefs = make_preferences(max_monthly_rent_eur=2000)
        commute = CommuteResult(
            listing_id="test-1", destination_address="A", duration_minutes=15.0, distance_km=4.0
        )
        evaluation = calculate_deterministic_scores(listing, prefs, commute, None, True)
        # 50% of max rent → score around 0.5
        assert evaluation.affordability_score > 0.4

    def test_commute_scoring(self):
        listing = make_listing()
        prefs = make_preferences(max_commute_minutes=60)
        commute = CommuteResult(
            listing_id="test-1", destination_address="A", duration_minutes=15.0, distance_km=4.0
        )
        evaluation = calculate_deterministic_scores(listing, prefs, commute, None, True)
        assert evaluation.commute_score > 0.5

    def test_agent_cannot_override_hard_constraints(self):
        """Hard constraints are computed by code, not agents."""
        listing = make_listing(monthly_rent_eur=3000)
        prefs = make_preferences(max_monthly_rent_eur=2000)
        commute = CommuteResult(
            listing_id="test-1", destination_address="A", duration_minutes=10.0, distance_km=3.0
        )
        evaluation = calculate_deterministic_scores(listing, prefs, commute, None, True)
        # Even though hard_constraints_passed is set to True (for testing),
        # the deterministic scoring should still reflect the high rent
        assert evaluation.affordability_score == 0.0  # 3000/2000 > 1, clamped to 0

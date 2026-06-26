from __future__ import annotations

import asyncio

from relocation_scout.agents.agent_validation import AgentOutputValidator
from relocation_scout.agents.mock_runtime import MockAgentRuntime
from relocation_scout.config import settings
from relocation_scout.contracts.audit import ActorType, AuditEventType
from relocation_scout.contracts.listing import NormalizedListing
from relocation_scout.contracts.preferences import HousingPreferences
from relocation_scout.contracts.ranking import ListingEvaluation
from relocation_scout.contracts.research import CommuteResult, NeighbourhoodAssessment
from relocation_scout.contracts.workflow import StepResult, WorkflowContext
from relocation_scout.deterministic.commute import calculate_commute
from relocation_scout.deterministic.deduplication import deduplicate_listings
from relocation_scout.deterministic.filtering import check_hard_constraints
from relocation_scout.deterministic.normalization import normalize_listing
from relocation_scout.deterministic.scoring import calculate_deterministic_scores
from relocation_scout.deterministic.validation import validate_listing
from relocation_scout.observability.events import AuditLogger
from relocation_scout.observability.tracing import metrics
from relocation_scout.tools.listing_provider import fetch_listings_from_providers
from relocation_scout.tools.maps import get_neighbourhood_facts


def _get_agent_runtime():
    """Select agent runtime based on configuration."""
    if settings.agent_runtime == "adk":
        from relocation_scout.agents.adk_runtime import ADKAgentRuntime

        return ADKAgentRuntime(api_key=settings.google_api_key)
    return MockAgentRuntime()


class WorkflowSteps:
    """Implementations of all workflow steps."""

    def __init__(self, audit: AuditLogger):
        self.audit = audit
        self.agent_runtime = _get_agent_runtime()
        self.validator = AgentOutputValidator(audit)
        self._failure_injection: dict[str, bool] = {}

    def set_failure_injection(self, step: str, enabled: bool = True):
        self._failure_injection[step] = enabled

    # ── Step Implementations ──

    async def fetch_listings(self, ctx: WorkflowContext) -> StepResult:
        raw = await fetch_listings_from_providers()
        ctx.data["raw_listings"] = raw
        self.audit.emit(
            AuditEventType.WORKFLOW_STEP_COMPLETED,
            ActorType.DETERMINISTIC,
            f"Fetched {len(raw)} raw listings",
            ctx.search_id,
            "fetch_listings",
            metadata={"count": len(raw)},
        )
        return StepResult(step_name="fetch_listings", success=True, output={"count": len(raw)})

    async def normalize_listings(self, ctx: WorkflowContext) -> StepResult:
        raw_listings = ctx.data.get("raw_listings", [])
        normalized: list[NormalizedListing] = []

        for raw in raw_listings:
            provider = raw.get("_provider", raw.get("provider", "unknown"))
            norm = normalize_listing(raw, provider)
            issues = validate_listing(norm)
            if not issues:
                normalized.append(norm)
            else:
                self.audit.emit(
                    AuditEventType.SYSTEM_ERROR,
                    ActorType.DETERMINISTIC,
                    f"Listing validation failed: {issues}",
                    ctx.search_id,
                    metadata={"provider": provider, "issues": issues},
                )

        # Audit suspicious content
        suspicious = [n for n in normalized if n.is_suspicious]
        for s in suspicious:
            self.audit.emit(
                AuditEventType.SECURITY_SUSPICIOUS_CONTENT,
                ActorType.DETERMINISTIC,
                f"Suspicious content detected in listing {s.listing_id}",
                ctx.search_id,
                entity_type="listing",
                entity_id=s.listing_id,
                metadata={"reasons": s.suspicion_reasons},
            )

        ctx.data["normalized_listings"] = [n.model_dump() for n in normalized]
        self.audit.emit(
            AuditEventType.WORKFLOW_STEP_COMPLETED,
            ActorType.DETERMINISTIC,
            f"Normalized {len(normalized)} listings ({len(suspicious)} suspicious)",
            ctx.search_id,
            "normalize_listings",
            metadata={"total": len(normalized), "suspicious": len(suspicious)},
        )
        return StepResult(
            step_name="normalize_listings",
            success=True,
            output={"count": len(normalized), "suspicious": len(suspicious)},
        )

    async def deduplicate_listings(self, ctx: WorkflowContext) -> StepResult:
        listings = [NormalizedListing(**d) for d in ctx.data.get("normalized_listings", [])]
        before = len(listings)
        deduped = deduplicate_listings(listings)
        ctx.data["normalized_listings"] = [n.model_dump() for n in deduped]
        ctx.data["deduplicated"] = True
        removed = before - len(deduped)
        self.audit.emit(
            AuditEventType.WORKFLOW_STEP_COMPLETED,
            ActorType.DETERMINISTIC,
            f"Deduplicated: {before} → {len(deduped)} listings ({removed} duplicates removed)",
            ctx.search_id,
            "deduplicate_listings",
            metadata={"before": before, "after": len(deduped), "removed": removed},
        )
        return StepResult(
            step_name="deduplicate_listings",
            success=True,
            output={"before": before, "after": len(deduped), "removed": removed},
        )

    async def calculate_commutes(self, ctx: WorkflowContext) -> StepResult:
        if self._failure_injection.get("commute_timeout", False):
            raise TimeoutError("Simulated commute timeout")

        listings_data = ctx.data.get("normalized_listings", [])
        preferences = HousingPreferences(**ctx.data["preferences"])

        semaphore = asyncio.Semaphore(settings.max_concurrent_enrichments)

        async def _calc_one(ld: dict) -> CommuteResult:
            async with semaphore:
                listing = NormalizedListing(**ld)
                return calculate_commute(listing, preferences.destination_address)

        commutes = await asyncio.gather(*[_calc_one(ld) for ld in listings_data])
        ctx.data["commute_results"] = {c.listing_id: c.model_dump() for c in commutes}

        failures = [c for c in commutes if c.duration_minutes > preferences.max_commute_minutes]
        self.audit.emit(
            AuditEventType.WORKFLOW_STEP_COMPLETED,
            ActorType.DETERMINISTIC,
            f"Calculated commutes for {len(commutes)} listings",
            ctx.search_id,
            "calculate_commutes",
            metadata={"total": len(commutes), "exceeding_max": len(failures)},
        )
        return StepResult(
            step_name="calculate_commutes",
            success=True,
            output={"calculated": len(commutes), "exceeding_max_commute": len(failures)},
        )

    async def research_neighbourhoods(self, ctx: WorkflowContext) -> StepResult:
        listings_data = ctx.data.get("normalized_listings", [])
        preferences = HousingPreferences(**ctx.data["preferences"])

        # Gather unique neighbourhoods
        neighbourhoods = list({ld["neighbourhood"].lower().strip() for ld in listings_data})
        semaphore = asyncio.Semaphore(settings.max_concurrent_enrichments)

        async def _research_one(nb: str):
            async with semaphore:
                fixture = await get_neighbourhood_facts(nb)
                prefs_ctx = {
                    "priorities": preferences.priorities.model_dump(),
                    "free_text": preferences.free_text_preferences,
                }
                return await self.agent_runtime.research_neighbourhood(nb, fixture, prefs_ctx)

        assessments = await asyncio.gather(*[_research_one(nb) for nb in neighbourhoods])

        ctx.data["neighbourhood_assessments"] = {
            a.neighbourhood.lower().strip(): a.model_dump() for a in assessments
        }

        self.audit.emit(
            AuditEventType.WORKFLOW_STEP_COMPLETED,
            ActorType.AGENT,
            f"Researched {len(assessments)} neighbourhoods",
            ctx.search_id,
            "research_neighbourhoods",
            metadata={"neighbourhoods": neighbourhoods, "count": len(assessments)},
        )
        metrics.increment("agent_calls", self.agent_runtime.call_count)
        return StepResult(
            step_name="research_neighbourhoods",
            success=True,
            output={"neighbourhoods": len(assessments)},
        )

    async def calculate_deterministic_scores(self, ctx: WorkflowContext) -> StepResult:
        listings_data = ctx.data.get("normalized_listings", [])
        preferences = HousingPreferences(**ctx.data["preferences"])
        commutes = ctx.data.get("commute_results", {})
        nb_assessments = ctx.data.get("neighbourhood_assessments", {})

        evaluations: list[ListingEvaluation] = []

        for ld in listings_data:
            listing = NormalizedListing(**ld)
            commute_data = commutes.get(listing.listing_id)
            if not commute_data:
                continue

            commute = CommuteResult(**commute_data)
            passed, _failures = check_hard_constraints(listing, preferences, commute)

            nb_lower = listing.neighbourhood.lower().strip()
            nb_data = nb_assessments.get(nb_lower)
            nb = NeighbourhoodAssessment(**nb_data) if nb_data else None

            evaluation = calculate_deterministic_scores(
                listing,
                preferences,
                commute,
                nb,
                passed,
            )
            evaluations.append(evaluation)

        ctx.data["listing_evaluations"] = {e.listing_id: e.model_dump() for e in evaluations}

        by_rec = {"strong_match": 0, "possible_match": 0, "weak_match": 0, "reject": 0}
        for e in evaluations:
            by_rec[e.recommendation] = by_rec.get(e.recommendation, 0) + 1

        self.audit.emit(
            AuditEventType.WORKFLOW_STEP_COMPLETED,
            ActorType.DETERMINISTIC,
            f"Scored {len(evaluations)} listings",
            ctx.search_id,
            "calculate_deterministic_scores",
            metadata=by_rec,
        )
        return StepResult(
            step_name="calculate_deterministic_scores",
            success=True,
            output={"evaluated": len(evaluations), **by_rec},
        )

    async def generate_qualitative_evaluations(self, ctx: WorkflowContext) -> StepResult:
        listings_data = ctx.data.get("normalized_listings", [])
        evaluations = ctx.data.get("listing_evaluations", {})
        nb_assessments = ctx.data.get("neighbourhood_assessments", {})
        preferences = HousingPreferences(**ctx.data["preferences"])

        # Only evaluate listings that passed hard constraints and scored well
        candidates = []
        for ld in listings_data:
            ev = evaluations.get(ld["listing_id"])
            if ev and ev.get("hard_constraints_passed") and ev.get("overall_score", 0) >= 0.3:
                candidates.append((ld, ev))

        semaphore = asyncio.Semaphore(settings.max_concurrent_enrichments)

        async def _eval_one(ld, ev):
            async with semaphore:
                nb_lower = ld["neighbourhood"].lower().strip()
                nb_data = nb_assessments.get(nb_lower)
                return await self.agent_runtime.evaluate_qualitative_fit(
                    listing_data=ld,
                    deterministic_scores=ev,
                    neighbourhood_assessment=nb_data,
                    preferences_context={
                        "priorities": preferences.priorities.model_dump(),
                        "free_text": preferences.free_text_preferences,
                    },
                )

        results = await asyncio.gather(*[_eval_one(ld, ev) for ld, ev in candidates])

        for result in results:
            lid = result.get("listing_id", "")
            if lid in evaluations:
                ev = evaluations[lid]
                combined_overall = round(
                    ev["overall_score"] + result.get("qualitative_fit_score", 0) * 0.5, 3
                )
                ev["qualitative_fit_score"] = result.get("qualitative_fit_score", 0)
                ev["overall_score"] = combined_overall
                ev["agent_explanation"] = result.get("explanation", "")
                ev["is_qualitative"] = True
                if result.get("strengths"):
                    ev["strengths"] = ev.get("strengths", []) + result["strengths"]
                if result.get("concerns"):
                    ev["concerns"] = ev.get("concerns", []) + result["concerns"]
                if result.get("evidence_ids"):
                    ev["evidence_ids"] = ev.get("evidence_ids", []) + result["evidence_ids"]

        ctx.data["listing_evaluations"] = evaluations
        self.audit.emit(
            AuditEventType.WORKFLOW_STEP_COMPLETED,
            ActorType.AGENT,
            f"Generated qualitative evaluations for {len(results)} listings",
            ctx.search_id,
            "generate_qualitative_evaluations",
            metadata={"count": len(results)},
        )
        metrics.increment("agent_calls", self.agent_runtime.call_count)
        return StepResult(
            step_name="generate_qualitative_evaluations",
            success=True,
            output={"evaluated": len(results)},
        )

    async def build_shortlist(self, ctx: WorkflowContext) -> StepResult:
        evaluations = ctx.data.get("listing_evaluations", {})
        listings_data = ctx.data.get("normalized_listings", [])
        commutes = ctx.data.get("commute_results", {})

        # Sort by overall score
        ranked = sorted(
            [(lid, ev) for lid, ev in evaluations.items() if ev.get("hard_constraints_passed")],
            key=lambda x: x[1].get("overall_score", 0),
            reverse=True,
        )

        shortlist = []
        for rank, (lid, ev) in enumerate(ranked[:5], 1):
            ld = next((entry for entry in listings_data if entry["listing_id"] == lid), None)
            if ld:
                commute_data = commutes.get(lid, {})
                shortlist.append(
                    {
                        "rank": rank,
                        "listing_id": lid,
                        "title": ld["title"],
                        "address": ld["address"],
                        "neighbourhood": ld["neighbourhood"],
                        "monthly_rent_eur": ld["monthly_rent_eur"],
                        "commute_minutes": commute_data.get("duration_minutes", 0),
                        "overall_score": ev.get("overall_score", 0),
                        "evaluation": ev,
                    }
                )

        # Agent synthesis
        if shortlist:
            synth = await self.agent_runtime.synthesize_shortlist(shortlist, {})
            ctx.data["shortlist"] = {
                "search_id": ctx.search_id,
                "entries": shortlist,
                "summary": synth.get("summary", ""),
                "comparison_notes": synth.get("comparison_notes", ""),
            }
        else:
            ctx.data["shortlist"] = {
                "search_id": ctx.search_id,
                "entries": [],
                "summary": "No listings passed all constraints.",
                "comparison_notes": "",
            }

        self.audit.emit(
            AuditEventType.WORKFLOW_STEP_COMPLETED,
            ActorType.AGENT,
            f"Built shortlist with {len(shortlist)} entries",
            ctx.search_id,
            "build_shortlist",
            metadata={"entries": len(shortlist)},
        )
        return StepResult(
            step_name="build_shortlist", success=True, output={"shortlist_size": len(shortlist)}
        )

    async def draft_realtor_message(self, ctx: WorkflowContext) -> StepResult:
        shortlist = ctx.data.get("shortlist", {})
        entries = shortlist.get("entries", [])

        if not entries:
            return StepResult(
                step_name="draft_realtor_message",
                success=False,
                error="No shortlist entries to draft message for",
            )

        top = entries[0]
        result = await self.agent_runtime.draft_realtor_message(
            listing_data={
                "title": top["title"],
                "address": top["address"],
                "neighbourhood": top["neighbourhood"],
                "monthly_rent_eur": top["monthly_rent_eur"],
            },
            user_intent="I am interested in viewing this property.",
            template_context={},
        )

        ctx.data["draft_message"] = result
        self.audit.emit(
            AuditEventType.WORKFLOW_STEP_COMPLETED,
            ActorType.AGENT,
            f"Drafted realtor message for {top['title']}",
            ctx.search_id,
            "draft_realtor_message",
            metadata={"listing_id": top["listing_id"]},
        )
        return StepResult(
            step_name="draft_realtor_message",
            success=True,
            output={"subject": result.get("subject", "")},
        )

    async def create_pending_action(self, ctx: WorkflowContext) -> StepResult:
        draft = ctx.data.get("draft_message", {})
        shortlist = ctx.data.get("shortlist", {})
        entries = shortlist.get("entries", [])

        if not entries:
            return StepResult(
                step_name="create_pending_action", success=False, error="No shortlist entries"
            )

        top = entries[0]
        payload = {
            "recipient": "agent@property.nl",
            "subject": draft.get("subject", ""),
            "body": draft.get("body", ""),
        }

        ctx.data["pending_action_payload"] = payload
        ctx.data["pending_action_listing_id"] = top["listing_id"]

        self.audit.emit(
            AuditEventType.ACTION_CREATED,
            ActorType.SYSTEM,
            "Created pending action for realtor message",
            ctx.search_id,
            "create_pending_action",
            metadata={"listing_id": top["listing_id"]},
        )
        return StepResult(
            step_name="create_pending_action",
            success=True,
            output={"listing_id": top["listing_id"]},
        )

    async def await_human_approval(self, ctx: WorkflowContext) -> StepResult:
        # This step marks that the workflow is waiting. Actual approval
        # happens through the API. This step is a checkpoint.
        self.audit.emit(
            AuditEventType.WORKFLOW_STEP_COMPLETED,
            ActorType.HUMAN,
            "Workflow awaiting human approval",
            ctx.search_id,
            "await_human_approval",
        )
        return StepResult(
            step_name="await_human_approval", success=True, output={"status": "awaiting_approval"}
        )

    async def execute_approved_action(self, ctx: WorkflowContext) -> StepResult:
        # This is handled by the controller which integrates with the approval gateway
        return StepResult(
            step_name="execute_approved_action",
            success=True,
            output={"note": "Execution handled by controller"},
        )

    async def finalize_workflow(self, ctx: WorkflowContext) -> StepResult:
        self.audit.emit(
            AuditEventType.WORKFLOW_COMPLETED,
            ActorType.SYSTEM,
            "Workflow completed successfully",
            ctx.search_id,
            "finalize_workflow",
        )
        return StepResult(
            step_name="finalize_workflow", success=True, output={"status": "completed"}
        )

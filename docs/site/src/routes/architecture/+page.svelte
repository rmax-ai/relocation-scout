<script>
  import { base } from "$app/paths";
</script>

<svelte:head>
  <title>Architecture — Relocation Scout</title>
</svelte:head>

<h1>Architecture</h1>

<h2>Three-Plane Separation</h2>

<p>The system is divided into three planes with strict boundaries:</p>

<table>
  <thead>
    <tr><th>Plane</th><th>Responsibility</th><th>Examples</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Deterministic</strong></td><td>Binary correctness</td><td>Normalization, dedup, commute calc, hard filters, scoring, state machine, idempotency</td></tr>
    <tr><td><strong>Agentic</strong></td><td>Judgment &amp; interpretation</td><td>Neighbourhood assessment, qualitative ranking, shortlist synthesis, message drafting</td></tr>
    <tr><td><strong>Human</strong></td><td>External side-effect authority</td><td>Approve/reject realtor messages</td></tr>
  </tbody>
</table>

<hr />

<h2>Component Ownership</h2>

<table>
  <thead>
    <tr><th>Directory</th><th>Owns</th><th>Rules</th></tr>
  </thead>
  <tbody>
    <tr><td><code>contracts/</code></td><td>Pydantic models for all domain types</td><td>No business logic; pure data models with validators</td></tr>
    <tr><td><code>workflow/</code></td><td>State machine, step implementations, controller</td><td>Only this layer changes workflow state</td></tr>
    <tr><td><code>deterministic/</code></td><td>Normalization, dedup, commute, filtering, scoring</td><td>Pure functions, no I/O, no LLM calls</td></tr>
    <tr><td><code>agents/</code></td><td>Agent interfaces, mock/ADK runtimes</td><td>Agents produce typed outputs; never mutate state</td></tr>
    <tr><td><code>tools/</code></td><td>Mock external services (listings, maps, email)</td><td>Only tool registry exposes tools; agents get read-only subset</td></tr>
    <tr><td><code>persistence/</code></td><td>SQLAlchemy models, database, repositories, UoW</td><td>No business logic; pure data access</td></tr>
    <tr><td><code>security/</code></td><td>Untrusted input wrapper, prompt injection scanner, redaction</td><td>Applied at system boundaries</td></tr>
    <tr><td><code>observability/</code></td><td>Structured logging, audit events, tracing, metrics</td><td>All components emit events through this layer</td></tr>
  </tbody>
</table>

<hr />

<h2>Data Flow</h2>

<ol>
  <li><strong>User</strong> creates search with preferences → persisted to SQLite</li>
  <li><strong>Workflow engine</strong> executes steps sequentially with validated transitions</li>
  <li><strong>Deterministic pipeline</strong> fetches, normalizes, deduplicates, scores listings</li>
  <li><strong>Agent runtime</strong> (mock or ADK/Gemini) provides qualitative assessments</li>
  <li><strong>Approval gateway</strong> gates all external actions behind human review</li>
  <li><strong>Audit logger</strong> records every event across all planes</li>
</ol>

<hr />

<h2>Trust Boundaries</h2>

<table>
  <thead>
    <tr><th>#</th><th>Boundary</th><th>Protects</th></tr>
  </thead>
  <tbody>
    <tr><td>1</td><td>Untrusted Input → Agent</td><td>Agent prompt integrity</td></tr>
    <tr><td>2</td><td>Agent → Workflow State</td><td>State consistency</td></tr>
    <tr><td>3</td><td>Agent → External Tools</td><td>Side-effect safety</td></tr>
    <tr><td>4</td><td>Human → Approval Gateway</td><td>Authorization</td></tr>
    <tr><td>5</td><td>Approval → Execution</td><td>Payload integrity</td></tr>
    <tr><td>6</td><td>Execution → External Service</td><td>Idempotency</td></tr>
    <tr><td>7</td><td>All Components → Audit Log</td><td>Non-repudiation</td></tr>
  </tbody>
</table>

<hr />

<h2>Agent Runtime Isolation</h2>

<p>The <code>AgentInterface</code> protocol ensures the workflow engine never depends on a specific LLM:</p>

<pre><code>class AgentInterface(Protocol):
    async def research_neighbourhood(...) -> NeighbourhoodAssessment: ...
    async def evaluate_qualitative_fit(...) -> dict: ...
    async def synthesize_shortlist(...) -> dict: ...
    async def draft_realtor_message(...) -> dict: ...</code></pre>

<p><strong>Mock runtime:</strong> Deterministic canned responses. No API keys. CI, demos, development.<br />
<strong>ADK runtime:</strong> Live Gemini 2.5 Flash via Google ADK. Same contracts, same validation, same security boundaries.</p>

<hr />

<h2>Threat Model</h2>

<p>10 documented threats across 4 categories:</p>

<table>
  <thead>
    <tr><th>Category</th><th>Threats</th><th>Controls</th></tr>
  </thead>
  <tbody>
    <tr><td>Prompt Injection</td><td>3</td><td>Input wrapping, system prompt defenses, scanner</td></tr>
    <tr><td>Agent Misbehavior</td><td>3</td><td>Schema validation, no tool access, output repair</td></tr>
    <tr><td>Authorization Bypass</td><td>2</td><td>Approval gateway, payload hash binding</td></tr>
    <tr><td>Operational</td><td>2</td><td>Idempotency, crash recovery, audit trail</td></tr>
  </tbody>
</table>

<p><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/threat-model.md">Full threat model →</a></p>

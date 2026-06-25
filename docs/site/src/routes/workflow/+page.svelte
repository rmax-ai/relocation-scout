<svelte:head>
  <title>Workflow — Relocation Scout</title>
</svelte:head>

<h1>Workflow</h1>

<h2>Pipeline Overview</h2>

<p>The workflow is a 10-step deterministic pipeline with agent-in-the-loop judgment calls. Steps labeled <strong>[CODE]</strong> are pure deterministic functions. Steps labeled <strong>[AGENT]</strong> involve LLM judgment (schema-validated). <strong>[HUMAN]</strong> steps require explicit approval.</p>

<hr />

<h2>Step Details</h2>

<h3>Step 1–3: Ingestion &amp; Normalization <code>[CODE]</code></h3>

<table>
  <thead><tr><th>Step</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>fetch_listings</code></td><td>Fetches 13 raw listings from 2 mock providers (Jaap, Funda)</td></tr>
    <tr><td><code>normalize_listings</code></td><td>Maps provider schemas to <code>NormalizedListing</code>. Runs prompt injection scanner. Flags suspicious content.</td></tr>
    <tr><td><code>deduplicate_listings</code></td><td>Cross-provider dedup by address + listing key. Removes exact and near-duplicates.</td></tr>
  </tbody>
</table>

<h3>Step 4–5: Enrichment</h3>

<table>
  <thead><tr><th>Step</th><th>Actor</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>calculate_commutes</code></td><td>CODE</td><td>Computes commute time + distance in parallel with concurrency limit</td></tr>
    <tr><td><code>research_neighbourhoods</code></td><td>AGENT</td><td>Assesses each neighbourhood on 3 dimensions: quiet, transport, green space. Produces evidence-cited assessments.</td></tr>
  </tbody>
</table>

<h3>Step 6–7: Scoring</h3>

<table>
  <thead><tr><th>Step</th><th>Actor</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>calculate_deterministic_scores</code></td><td>CODE</td><td>Affordability, commute, neighbourhood, space scores. Hard constraints applied. Recommendation tier.</td></tr>
    <tr><td><code>generate_qualitative_evaluations</code></td><td>AGENT</td><td>Agent evaluates fit against qualitative preferences. <strong>Cannot override hard constraint results.</strong></td></tr>
  </tbody>
</table>

<h3>Step 8–10: Delivery &amp; Approval</h3>

<table>
  <thead><tr><th>Step</th><th>Actor</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>build_shortlist</code></td><td>CODE + AGENT</td><td>Ranks by combined score. Agent synthesizes summary with trade-offs.</td></tr>
    <tr><td><code>draft_realtor_message</code></td><td>AGENT</td><td>Drafts professional email. <strong>Agent cannot send — only draft.</strong></td></tr>
    <tr><td><code>create_pending_action</code></td><td>CODE</td><td>Creates pending action with idempotency key + payload hash. Enters <code>awaiting_approval</code>.</td></tr>
  </tbody>
</table>

<h3>Approval &amp; Execution <code>[HUMAN + CODE]</code></h3>

<table>
  <thead><tr><th>Step</th><th>Actor</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>await_human_approval</code></td><td>HUMAN</td><td>User reviews draft. Can edit, approve, or reject.</td></tr>
    <tr><td><code>execute_approved_action</code></td><td>CODE</td><td>Verifies payload hash. Checks idempotency. Sends email. Records atomically.</td></tr>
  </tbody>
</table>

<hr />

<h2>State Machine</h2>

<pre><code>created → listings_fetched → listings_normalized → listings_deduplicated
  → enrichment_running → enrichment_complete → ranking_complete
  → shortlist_created → awaiting_approval → action_executed → completed

Any state can transition to: failed → retry</code></pre>

<p>Transitions are validated by <code>is_valid_transition()</code> — invalid transitions rejected at the controller level.</p>

<hr />

<h2>Retry &amp; Recovery</h2>

<table>
  <thead><tr><th>Mechanism</th><th>How</th></tr></thead>
  <tbody>
    <tr><td><strong>Per-step retry</strong></td><td>Tenacity-based with exponential backoff. Configurable per step.</td></tr>
    <tr><td><strong>Crash recovery</strong></td><td>State persisted after each step. <code>resume_workflow()</code> reconstructs from DB.</td></tr>
    <tr><td><strong>Idempotency</strong></td><td>Every action keyed: <code>email:listing_id:recipient:payload_hash</code>. Duplicates blocked.</td></tr>
    <tr><td><strong>Reconciliation</strong></td><td>Post-crash: detects sent email, marks completed — no duplicate send.</td></tr>
  </tbody>
</table>

<hr />

<h2>Concurrency</h2>

<p>Steps processing multiple items run in parallel with a configurable semaphore (<code>max_concurrent_enrichments</code>, default 4). Applies to: <code>calculate_commutes</code>, <code>research_neighbourhoods</code>, <code>generate_qualitative_evaluations</code>.</p>

<hr />

<h2>Audit Trail</h2>

<p>Every transition, agent call, security event, and external action produces an audit event:</p>

<table>
  <thead><tr><th>Event Type</th><th>Actor</th><th>Trigger</th></tr></thead>
  <tbody>
    <tr><td><code>workflow.started</code></td><td>SYSTEM</td><td>Workflow creation</td></tr>
    <tr><td><code>workflow.step_started</code></td><td>DET</td><td>Step begins</td></tr>
    <tr><td><code>workflow.step_completed</code></td><td>DET / AGENT</td><td>Step finishes</td></tr>
    <tr><td><code>security.suspicious_content</code></td><td>DET</td><td>Prompt injection detected</td></tr>
    <tr><td><code>action.created</code></td><td>SYSTEM</td><td>Pending action created</td></tr>
    <tr><td><code>action.approved</code></td><td>HUMAN</td><td>User approves</td></tr>
    <tr><td><code>action.executed</code></td><td>TOOL</td><td>External action complete</td></tr>
    <tr><td><code>action.duplicate_prevented</code></td><td>SYSTEM</td><td>Idempotency check blocks duplicate</td></tr>
    <tr><td><code>system.recovery</code></td><td>SYSTEM</td><td>Crash recovery reconciles</td></tr>
  </tbody>
</table>

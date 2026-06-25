<script>
  import { base } from "$app/paths";
</script>

<svelte:head>
  <title>Relocation Scout</title>
  <meta name="description" content="Production-oriented agentic systems PoC" />
</svelte:head>

<div class="hero">
  <span class="badge">v0.1.0</span>
  <h1>Relocation Scout</h1>
  <p class="tagline">A governed AI workflow for house-hunting. <strong>Not a chatbot. Not a prompt wrapper.</strong></p>
  <p class="subtitle">Production-oriented proof-of-concept demonstrating how to build agentic systems where <em>code handles determinism, agents provide judgment, and humans retain authority.</em></p>
  <div class="cta-group">
    <a href="https://github.com/rmax-ai/relocation-scout" class="cta-primary" target="_blank" rel="noopener">View on GitHub →</a>
    <a href={base + "/architecture/"} class="cta-secondary">Explore Architecture</a>
  </div>
</div>

<hr />

<h2>The Architectural Thesis</h2>

<blockquote>
  <p><strong>Use code for determinism, agents for judgment, and humans for authority.</strong></p>
</blockquote>

<p>Most "AI agent" demos hand the LLM a prompt, a tool list, and hope for the best. That's not engineering — that's vibes.</p>

<p>Relocation Scout demonstrates a different approach:</p>

<table>
  <thead>
    <tr><th>Plane</th><th>What it handles</th><th>How</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Deterministic</strong></td><td>Normalization, dedup, commute, hard constraints, scoring, state machine, idempotency</td><td>Pure Python functions — no LLM</td></tr>
    <tr><td><strong>Agentic</strong></td><td>Neighbourhood assessment, qualitative ranking, shortlist synthesis, message drafting</td><td>Narrowly-scoped LLM calls with Pydantic-validated outputs</td></tr>
    <tr><td><strong>Human</strong></td><td>Approval of any external side effect</td><td>Code-level gateway — not a prompt</td></tr>
  </tbody>
</table>

<p>The LLM is a <strong>narrowly-scoped component</strong> inside a larger software system. The workflow state machine, persistence, contracts, and security boundaries are all conventional engineering.</p>

<hr />

<h2>What It Does</h2>

<ol>
  <li><strong>Create a search</strong> — set budget, bedrooms, commute max, preferred neighborhoods, priorities</li>
  <li><strong>Watch the pipeline run</strong> — 10 automated steps from fetching listings to drafting messages</li>
  <li><strong>Inspect results</strong> — ranked shortlist with deterministic scores + agent qualitative assessments</li>
  <li><strong>Approve and execute</strong> — human reviews and approves the realtor message before it's sent</li>
  <li><strong>Trust the system</strong> — prompt injection defense, idempotent actions, crash recovery, full audit trail</li>
</ol>

<hr />

<h2>Key Invariants</h2>

<ul>
  <li>Agents <strong>never</strong> execute external side effects</li>
  <li>All side effects pass through the <strong>approval gateway</strong></li>
  <li>All LLM outputs are <strong>schema-validated</strong> (Pydantic v2)</li>
  <li>External content is treated as <strong>untrusted</strong></li>
  <li>Workflow state lives in <strong>SQLite</strong>, not LLM context</li>
  <li>Every external action has an <strong>idempotency key</strong></li>
  <li>Approved payloads <strong>cannot change</strong> without invalidating approval</li>
</ul>

<hr />

<h2>Quick Start</h2>

<pre><code>git clone https://github.com/rmax-ai/relocation-scout.git
cd relocation-scout
make demo</code></pre>

<ul>
  <li><strong>Backend:</strong> <code>http://localhost:8000/docs</code> (OpenAPI)</li>
  <li><strong>Frontend:</strong> <code>http://localhost:5173</code></li>
</ul>

<p>Mock mode is the default — no API keys required. Set <code>AGENT_RUNTIME=adk</code> + <code>GOOGLE_API_KEY</code> for live Gemini 2.5 Flash.</p>

<hr />

<h2>By The Numbers</h2>

<table>
  <thead><tr><th>Metric</th><th>Count</th></tr></thead>
  <tbody>
    <tr><td>Backend modules</td><td>29</td></tr>
    <tr><td>Frontend pages</td><td>10</td></tr>
    <tr><td>Unit tests</td><td>26 (all passing)</td></tr>
    <tr><td>Acceptance criteria</td><td>71</td></tr>
    <tr><td>ADRs</td><td>4</td></tr>
    <tr><td>Threat model entries</td><td>10</td></tr>
  </tbody>
</table>

<hr />

<h2>Architecture at a Glance</h2>

<pre><code>┌─────────────────────────────────────────────────────┐
│                    API Layer (FastAPI)               │
├──────────┬──────────────────┬───────────────────────┤
│ Contracts│   Workflow       │   Persistence         │
│ Pydantic │   State Machine  │   SQLAlchemy + SQLite │
├──────────┼──────────────────┼───────────────────────┤
│ Agents   │   Deterministic  │   Tools               │
│ Mock/ADK │   Pipeline       │   Listing/Maps/Email  │
├──────────┴──────────────────┴───────────────────────┤
│  Security       │  Observability    │  Approval GW   │
│  Injection Def  │  Audit + Metrics  │  Idempotency   │
└─────────────────────────────────────────────────────┘</code></pre>

<p><a href={base + "/architecture/"}>Explore the full architecture →</a></p>

<hr />

<h2>Built With</h2>

<p><strong>Backend:</strong> Python 3.12 · FastAPI · Pydantic v2 · SQLAlchemy 2.0 · Tenacity · Structlog · Google ADK<br />
<strong>Frontend:</strong> React 18 · TypeScript · Vite · TanStack Query v5 · Tailwind CSS<br />
<strong>Infra:</strong> Docker · docker-compose · GitHub Actions</p>

<div class="footer-cta">
  <a href="https://github.com/rmax-ai/relocation-scout" class="cta-primary" target="_blank" rel="noopener">View on GitHub →</a>
</div>

<style>
  .hero {
    text-align: center;
    padding: 2rem 0 3rem;
  }
  .badge {
    display: inline-block;
    background: rgba(34, 211, 238, 0.1);
    color: #22d3ee;
    border: 1px solid rgba(34, 211, 238, 0.2);
    border-radius: 20px;
    padding: 0.2rem 0.9rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    margin-bottom: 1.5rem;
  }
  .tagline {
    font-size: 1.2rem;
    color: #e2e8f0;
    margin-bottom: 0.75rem;
    font-weight: 500;
  }
  .subtitle {
    font-size: 1rem;
    color: #94a3b8;
    max-width: 600px;
    margin: 0 auto 2rem;
  }
  .cta-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  :global(.cta-primary) {
    display: inline-block;
    background: #22d3ee;
    color: #020617 !important;
    padding: 0.6rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none !important;
    transition: background 0.15s;
  }
  :global(.cta-primary:hover) {
    background: #67e8f9;
  }
  :global(.cta-secondary) {
    display: inline-block;
    color: #22d3ee !important;
    padding: 0.6rem 1.5rem;
    border: 1px solid #1e293b;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.95rem;
    text-decoration: none !important;
    transition: border-color 0.15s;
  }
  :global(.cta-secondary:hover) {
    border-color: #22d3ee;
  }
  .footer-cta {
    text-align: center;
    margin-top: 3rem;
  }
</style>

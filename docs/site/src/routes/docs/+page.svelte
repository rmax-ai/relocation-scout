<svelte:head>
  <title>Docs — Relocation Scout</title>
</svelte:head>

<h1>Documentation</h1>

<h2>Project Docs</h2>

<table>
  <thead><tr><th>Document</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout">README</a></td><td>Overview, quickstart, commands</td></tr>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/SPEC.md">SPEC.md</a></td><td>71 acceptance criteria</td></tr>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/AGENTS.md">AGENTS.md</a></td><td>Coding agent conventions</td></tr>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/roadmap.md">ROADMAP.md</a></td><td>14-phase implementation plan</td></tr>
  </tbody>
</table>

<h2>Architecture &amp; Security</h2>

<table>
  <thead><tr><th>Document</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/architecture.md">ARCHITECTURE.md</a></td><td>Component architecture, trust boundaries</td></tr>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/threat-model.md">THREAT_MODEL.md</a></td><td>10 threats with attack paths and controls</td></tr>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/workflow.md">workflow.md</a></td><td>Pipeline specification</td></tr>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/contracts.md">contracts.md</a></td><td>Domain contract definitions</td></tr>
  </tbody>
</table>

<h2>Decisions (ADRs)</h2>

<table>
  <thead><tr><th>ADR</th><th>Decision</th></tr></thead>
  <tbody>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/decisions/001-sqlite-first.md">001</a></td><td>SQLite-first persistence</td></tr>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/decisions/002-explicit-workflow-controller.md">002</a></td><td>Explicit workflow controller</td></tr>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/decisions/003-human-approval-gateway.md">003</a></td><td>Human approval gateway</td></tr>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/decisions/004-agent-framework-isolation.md">004</a></td><td>Agent framework isolation</td></tr>
  </tbody>
</table>

<h2>Operational</h2>

<table>
  <thead><tr><th>Document</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/recovery.md">recovery.md</a></td><td>Crash recovery and reconciliation</td></tr>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/evaluation.md">evaluation.md</a></td><td>Evaluation methodology</td></tr>
    <tr><td><a href="https://github.com/rmax-ai/relocation-scout/blob/main/docs/demo-script.md">demo-script.md</a></td><td>5-minute demo walkthrough</td></tr>
  </tbody>
</table>

<hr />

<h2>API Endpoints</h2>

<h3>Searches</h3>

<table>
  <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>POST</code></td><td><code>/api/searches</code></td><td>Create a new search</td></tr>
    <tr><td><code>GET</code></td><td><code>/api/searches</code></td><td>List all searches</td></tr>
    <tr><td><code>GET</code></td><td><code>/api/searches/{'{'}id{'}'}</code></td><td>Get search details</td></tr>
    <tr><td><code>POST</code></td><td><code>/api/searches/{'{'}id{'}'}/start</code></td><td>Start workflow execution</td></tr>
    <tr><td><code>POST</code></td><td><code>/api/searches/{'{'}id{'}'}/resume</code></td><td>Resume failed workflow</td></tr>
  </tbody>
</table>

<h3>Listings &amp; Workflow</h3>

<table>
  <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/api/searches/{'{'}id{'}'}/listings</code></td><td>Get listings (with filters)</td></tr>
    <tr><td><code>GET</code></td><td><code>/api/searches/{'{'}id{'}'}/shortlist</code></td><td>Get ranked shortlist</td></tr>
    <tr><td><code>GET</code></td><td><code>/api/searches/{'{'}id{'}'}/workflow</code></td><td>Workflow status</td></tr>
    <tr><td><code>GET</code></td><td><code>/api/searches/{'{'}id{'}'}/workflow/steps</code></td><td>Step execution details</td></tr>
  </tbody>
</table>

<h3>Actions</h3>

<table>
  <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/api/actions/{'{'}id{'}'}</code></td><td>Action detail</td></tr>
    <tr><td><code>PUT</code></td><td><code>/api/actions/{'{'}id{'}'}/edit</code></td><td>Edit action payload</td></tr>
    <tr><td><code>POST</code></td><td><code>/api/actions/{'{'}id{'}'}/approve</code></td><td>Approve action</td></tr>
    <tr><td><code>POST</code></td><td><code>/api/actions/{'{'}id{'}'}/execute</code></td><td>Execute approved action</td></tr>
  </tbody>
</table>

<h3>Audit &amp; Health</h3>

<table>
  <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/api/audit</code></td><td>Query audit log</td></tr>
    <tr><td><code>GET</code></td><td><code>/api/searches/{'{'}id{'}'}/audit/export</code></td><td>Export full audit trail (JSON)</td></tr>
    <tr><td><code>GET</code></td><td><code>/api/health</code></td><td>Health check + runtime info</td></tr>
  </tbody>
</table>

<hr />

<h2>Makefile Commands</h2>

<pre><code>make install      # Install all dependencies
make dev          # Start backend + frontend
make test         # Run all backend tests
make lint         # Ruff check + format check
make seed         # Seed demo data
make reset        # Reset database
make demo         # Reset + seed + start
make verify       # Full verification
make clean        # Remove venv, node_modules, DB</code></pre>

<hr />

<h2>Environment</h2>

<table>
  <thead><tr><th>Variable</th><th>Default</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>DATABASE_URL</code></td><td><code>sqlite+aiosqlite:///./data/relocation_scout.db</code></td><td>SQLite for local dev</td></tr>
    <tr><td><code>AGENT_RUNTIME</code></td><td><code>mock</code></td><td><code>mock</code> or <code>adk</code> (Gemini)</td></tr>
    <tr><td><code>MAX_CONCURRENT_ENRICHMENTS</code></td><td><code>4</code></td><td>Parallel step concurrency</td></tr>
    <tr><td><code>LOG_LEVEL</code></td><td><code>INFO</code></td><td><code>DEBUG</code> for verbose</td></tr>
  </tbody>
</table>

<hr />

<p><a href="https://github.com/rmax-ai/relocation-scout">View full source on GitHub →</a></p>

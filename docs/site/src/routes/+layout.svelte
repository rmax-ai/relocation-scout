<script>
  import { base } from "$app/paths";
  let { children } = $props();
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="{base}/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
</svelte:head>

<div class="app">
  <nav class="top-nav">
    <a href={base + "/"} class="logo">▸ Relocation Scout</a>
    <div class="nav-links">
      <a href={base + "/architecture/"}>Architecture</a>
      <a href={base + "/workflow/"}>Workflow</a>
      <a href={base + "/docs/"}>Docs</a>
      <a href="https://github.com/rmax-ai/relocation-scout" class="gh-link" target="_blank" rel="noopener" aria-label="GitHub repository">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/></svg>
      </a>
    </div>
  </nav>
  <main>
    {@render children()}
  </main>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    background: #020617;
    color: #e2e8f0;
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }

  :global(h1, h2, h3, h4) {
    font-family: 'JetBrains Mono', monospace;
    color: #f1f5f9;
    line-height: 1.3;
  }

  :global(h1) { font-size: 2.25rem; font-weight: 600; margin-bottom: 0.75rem; }
  :global(h2) { font-size: 1.5rem; font-weight: 500; margin-top: 3rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #1e293b; }
  :global(h3) { font-size: 1.15rem; font-weight: 500; margin-top: 2rem; margin-bottom: 0.5rem; color: #22d3ee; }
  :global(h4) { font-size: 1rem; font-weight: 500; margin-top: 1.5rem; margin-bottom: 0.5rem; }

  :global(p) { margin-bottom: 1rem; color: #cbd5e1; }
  :global(a) { color: #22d3ee; text-decoration: none; }
  :global(a:hover) { text-decoration: underline; }

  :global(code) {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85em;
    background: rgba(30, 41, 59, 0.6);
    padding: 0.15em 0.4em;
    border-radius: 4px;
    color: #e2e8f0;
  }

  :global(pre) {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 1.25rem;
    overflow-x: auto;
    margin: 1.5rem 0;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  :global(pre code) {
    background: none;
    padding: 0;
  }

  :global(ul, ol) {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
    color: #cbd5e1;
  }

  :global(li) { margin-bottom: 0.35rem; }

  :global(blockquote) {
    border-left: 3px solid #22d3ee;
    padding: 0.5rem 1rem;
    margin: 1.5rem 0;
    background: rgba(34, 211, 238, 0.05);
    border-radius: 0 6px 6px 0;
  }

  :global(blockquote p) { color: #94a3b8; font-style: italic; margin: 0; }

  :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.9rem;
  }

  :global(th) {
    text-align: left;
    padding: 0.75rem 1rem;
    background: rgba(30, 41, 59, 0.5);
    border-bottom: 2px solid #1e293b;
    color: #22d3ee;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  :global(td) {
    padding: 0.6rem 1rem;
    border-bottom: 1px solid #1e293b;
    color: #cbd5e1;
  }

  :global(hr) {
    border: none;
    border-top: 1px solid #1e293b;
    margin: 2rem 0;
  }

  :global(strong) { color: #f1f5f9; }

  .app {
    min-height: 100vh;
  }

  .top-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    height: 56px;
    background: rgba(2, 6, 23, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #1e293b;
  }

  .logo {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1rem;
    font-weight: 600;
    color: #22d3ee !important;
    text-decoration: none !important;
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .nav-links a {
    font-size: 0.875rem;
    color: #94a3b8;
    font-weight: 500;
    transition: color 0.15s;
  }

  .nav-links a:hover {
    color: #e2e8f0;
    text-decoration: none;
  }

  .gh-link {
    display: flex;
    align-items: center;
    color: #64748b !important;
  }

  .gh-link:hover {
    color: #e2e8f0 !important;
  }

  main {
    max-width: 820px;
    margin: 0 auto;
    padding: 3rem 1.5rem 6rem;
  }

  @media (max-width: 640px) {
    main { padding: 2rem 1rem 4rem; }
    .nav-links { gap: 1rem; }
    :global(h1) { font-size: 1.75rem; }
  }
</style>

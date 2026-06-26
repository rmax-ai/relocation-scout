import { defineConfig, devices } from '@playwright/test';

const frontendPort = 4173;
const frontendURL = `http://127.0.0.1:${frontendPort}`;
const backendURL = 'http://127.0.0.1:8000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: frontendURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command:
        'AGENT_RUNTIME=mock PYTHONPATH=../backend/src ../.venv/bin/python3 -m uvicorn relocation_scout.main:app --host 127.0.0.1 --port 8000',
      url: `${backendURL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${frontendPort}`,
      url: frontendURL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});

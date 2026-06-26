import { expect, test } from '../fixtures.js';

type DemoFailures = {
  malformed_agent_output: boolean;
  neighbourhood_agent_failure: boolean;
  commute_timeout: boolean;
  crash_before_email_send: boolean;
  crash_after_email_send: boolean;
  duplicate_workflow_steps: boolean;
  prompt_injection_fixture: boolean;
};

const initialFailures: DemoFailures = {
  malformed_agent_output: false,
  neighbourhood_agent_failure: false,
  commute_timeout: false,
  crash_before_email_send: false,
  crash_after_email_send: false,
  duplicate_workflow_steps: false,
  prompt_injection_fixture: false,
};

test.describe('phase 3 demo controls behavior', () => {
  test('supports reset, seed, and failure toggle behavior', async ({ page, demoState }) => {
    await demoState.resetAndSeed();

    let failures = { ...initialFailures };
    let seedCalls = 0;
    let resetCalls = 0;
    let lastFailurePatch: Partial<DemoFailures> | null = null;

    await page.route('**/api/demo/seed', async (route) => {
      seedCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ready', message: 'Seeded demo state.' }),
      });
    });

    await page.route('**/api/demo/reset', async (route) => {
      resetCalls += 1;
      failures = { ...initialFailures };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'reset', message: 'Reset demo state.' }),
      });
    });

    await page.route('**/api/demo/failures', async (route) => {
      if (route.request().method() === 'POST') {
        const patch = route.request().postDataJSON() as Partial<DemoFailures>;
        lastFailurePatch = patch;
        failures = { ...failures, ...patch };
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(failures),
      });
    });

    await page.goto('/demo');
    await expect(page.getByRole('heading', { name: 'Demo Controls' })).toBeVisible();

    await page.getByRole('button', { name: 'Seed Demo Data' }).click();
    await expect.poll(() => seedCalls).toBe(1);

    await page.getByRole('button', { name: 'Reset Demo' }).click();
    await expect.poll(() => resetCalls).toBe(1);

    const malformedRow = page
      .locator('div.flex.items-center.justify-between')
      .filter({ hasText: 'Malformed Agent Output' });
    await malformedRow.getByRole('button').click();

    await expect.poll(() => lastFailurePatch).toEqual({ malformed_agent_output: true });
    await expect(page.locator('main')).toContainText('Active Failures');
    await expect(page.locator('main')).toContainText('Malformed Agent Output');
  });
});

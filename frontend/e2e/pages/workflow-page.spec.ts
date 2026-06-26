import { expect, test } from '../fixtures.js';

const searchId = 'phase-3-workflow-search';

const runningWorkflow = {
  search_id: searchId,
  status: 'running',
  current_step: 'calculate_commutes',
  progress_percentage: 55,
  created_at: '2026-06-26T10:00:00Z',
  updated_at: '2026-06-26T10:05:00Z',
};

const runningSteps = [
  {
    step_name: 'fetch_listings',
    status: 'completed',
    started_at: '2026-06-26T10:00:01Z',
    completed_at: '2026-06-26T10:00:05Z',
    duration_ms: 4000,
    retry_count: 0,
    error_message: null,
  },
  {
    step_name: 'normalize_listings',
    status: 'completed',
    started_at: '2026-06-26T10:00:05Z',
    completed_at: '2026-06-26T10:00:09Z',
    duration_ms: 4000,
    retry_count: 0,
    error_message: null,
  },
  {
    step_name: 'calculate_commutes',
    status: 'running',
    started_at: '2026-06-26T10:00:10Z',
    completed_at: null,
    duration_ms: null,
    retry_count: 0,
    error_message: null,
  },
];

const failedWorkflow = {
  search_id: searchId,
  status: 'failed',
  current_step: 'deduplicate_listings',
  progress_percentage: 27,
  created_at: '2026-06-26T10:00:00Z',
  updated_at: '2026-06-26T10:08:00Z',
};

const failedSteps = [
  {
    step_name: 'fetch_listings',
    status: 'completed',
    started_at: '2026-06-26T10:00:01Z',
    completed_at: '2026-06-26T10:00:05Z',
    duration_ms: 4000,
    retry_count: 0,
    error_message: null,
  },
  {
    step_name: 'deduplicate_listings',
    status: 'failed',
    started_at: '2026-06-26T10:00:06Z',
    completed_at: '2026-06-26T10:00:08Z',
    duration_ms: 2000,
    retry_count: 1,
    error_message: 'Duplicate detection failed after malformed source payload.',
  },
];

test.describe('phase 3 workflow page behavior', () => {
  test('shows current step progression and failure details', async ({ page, demoState }) => {
    await demoState.resetAndSeed();

    let workflowRequests = 0;

    await page.route(`**/api/searches/${searchId}/workflow`, async (route) => {
      workflowRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(workflowRequests === 1 ? runningWorkflow : failedWorkflow),
      });
    });

    await page.route(`**/api/searches/${searchId}/workflow/steps`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(workflowRequests === 1 ? runningSteps : failedSteps),
      });
    });

    await page.goto(`/searches/${searchId}/workflow`);
    await expect(page.getByRole('heading', { name: 'Workflow' })).toBeVisible();
    await expect(page.locator('main')).toContainText('running');
    await expect(page.locator('main')).toContainText('Current step: calculate_commutes');
    await expect(page.locator('main')).toContainText('18%');
    await expect(page.locator('main')).toContainText('fetch_listings');
    await expect(page.locator('main')).toContainText('normalize_listings');

    await page.reload();
    await expect(page.locator('main')).toContainText('failed');
    await expect(page.locator('main')).toContainText('Current step: deduplicate_listings');
    await expect(page.locator('main')).toContainText(
      'Duplicate detection failed after malformed source payload.',
    );
  });
});

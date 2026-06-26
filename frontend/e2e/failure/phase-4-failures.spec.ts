import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '../fixtures.js';

const backendURL = 'http://127.0.0.1:8000';
const recoveryOutcomeStatuses = ['failed', 'awaiting_approval', 'completed'] as const;

type CreatedSearch = {
  id: string;
  name: string;
};

type WorkflowStatusResponse = {
  status: string;
};

type DemoFailuresPatch = {
  commute_timeout?: boolean;
};

async function createSearch(request: APIRequestContext, name: string): Promise<CreatedSearch> {
  const response = await request.post(`${backendURL}/api/searches`, {
    data: {
      name,
      preferences: {
        max_monthly_rent_eur: 2400,
        minimum_bedrooms: 2,
        minimum_area_m2: 55,
        destination_address: 'Amsterdam Centraal',
        max_commute_minutes: 45,
        preferred_neighbourhoods: ['De Pijp'],
        excluded_neighbourhoods: ['Red Light District'],
        priorities: {
          quiet: 0.25,
          transport: 0.25,
          green_space: 0.25,
          affordability: 0.25,
        },
        free_text_preferences: 'Phase 4 failure and recovery coverage.',
      },
    },
  });

  expect(response.ok()).toBeTruthy();
  return (await response.json()) as CreatedSearch;
}

async function startSearch(
  request: APIRequestContext,
  searchId: string,
): Promise<WorkflowStatusResponse> {
  const response = await request.post(`${backendURL}/api/searches/${searchId}/start`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as WorkflowStatusResponse;
}

async function setDemoFailures(
  request: APIRequestContext,
  patch: DemoFailuresPatch,
): Promise<void> {
  const response = await request.post(`${backendURL}/api/demo/failures`, { data: patch });
  expect(response.ok()).toBeTruthy();
}

async function createFailedSearch(
  request: APIRequestContext,
  name: string,
): Promise<CreatedSearch> {
  await setDemoFailures(request, { commute_timeout: true });

  try {
    const search = await createSearch(request, name);
    const workflow = await startSearch(request, search.id);
    expect(workflow.status).toBe('failed');
    return search;
  } finally {
    await setDemoFailures(request, { commute_timeout: false });
  }
}

async function getWorkflowStatus(request: APIRequestContext, searchId: string): Promise<string> {
  const response = await request.get(`${backendURL}/api/searches/${searchId}/workflow`);
  expect(response.ok()).toBeTruthy();
  const workflow = (await response.json()) as WorkflowStatusResponse;
  return workflow.status;
}

async function waitForRecoveryOutcome(
  request: APIRequestContext,
  searchId: string,
): Promise<(typeof recoveryOutcomeStatuses)[number]> {
  let lastStatus = '';
  await expect
    .poll(async () => {
      lastStatus = await getWorkflowStatus(request, searchId);
      return recoveryOutcomeStatuses.includes(
        lastStatus as (typeof recoveryOutcomeStatuses)[number],
      );
    }, { timeout: 20_000 })
    .toBeTruthy();

  return lastStatus as (typeof recoveryOutcomeStatuses)[number];
}

test.describe('phase 4 failure and recovery coverage', () => {
  test('renders failed workflow state and failure details', async ({ page, request, demoState }) => {
    await demoState.resetAndSeed();
    const search = await createFailedSearch(request, 'Phase 4 failed workflow state');

    await page.goto(`/searches/${search.id}`);

    await expect(page.getByRole('heading', { name: search.name })).toBeVisible();
    await expect(page.locator('main')).toContainText('failed');
    await expect(page.getByRole('button', { name: 'Resume Search' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry Failed Step' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset Search' })).toBeVisible();

    await page.goto(`/searches/${search.id}/workflow`);
    await expect(page.getByRole('heading', { name: 'Workflow' })).toBeVisible();
    await expect(page.locator('main')).toContainText('failed');
    await expect(page.locator('main')).toContainText('Current step:');
    await expect(page.locator('main')).toContainText('deduplicate_listings');
  });

  test('retry action either recovers or keeps failed state, per backend behavior', async ({
    page,
    request,
    demoState,
  }) => {
    await demoState.resetAndSeed();
    const search = await createFailedSearch(request, 'Phase 4 retry behavior');

    await page.goto(`/searches/${search.id}`);
    await page.getByRole('button', { name: 'Retry Failed Step' }).click();

    const statusAfterRetry = await waitForRecoveryOutcome(request, search.id);
    await page.reload();

    if (statusAfterRetry === 'failed') {
      await expect(page.locator('main')).toContainText('failed');
      await expect(page.getByRole('button', { name: 'Retry Failed Step' })).toBeVisible();
    } else {
      await expect(page.locator('main')).not.toContainText('failed');
      await expect(page.getByRole('button', { name: 'Retry Failed Step' })).toHaveCount(0);
      await expect(page.locator('main')).toContainText(statusAfterRetry.replace('_', ' '));
    }
  });

  test('resume action on resumable workflow behaves consistently', async ({
    page,
    request,
    demoState,
  }) => {
    await demoState.resetAndSeed();
    const search = await createFailedSearch(request, 'Phase 4 resume behavior');

    await page.goto(`/searches/${search.id}`);
    await page.getByRole('button', { name: 'Resume Search' }).click();

    const statusAfterResume = await waitForRecoveryOutcome(request, search.id);
    await page.reload();

    if (statusAfterResume === 'failed') {
      await expect(page.locator('main')).toContainText('failed');
      await expect(page.getByRole('button', { name: 'Resume Search' })).toBeVisible();
    } else {
      await expect(page.locator('main')).not.toContainText('failed');
      await expect(page.getByRole('button', { name: 'Resume Search' })).toHaveCount(0);
      await expect(page.locator('main')).toContainText(statusAfterResume.replace('_', ' '));
    }
  });

  test('renders empty states for searches, listings, and actions', async ({
    page,
    request,
    demoState,
  }) => {
    await demoState.resetAndSeed();

    await page.goto('/searches');
    await expect(page.getByRole('heading', { name: 'No Searches' })).toBeVisible();

    const search = await createSearch(request, 'Phase 4 empty states');

    await page.goto(`/searches/${search.id}/listings`);
    await expect(page.getByRole('heading', { name: 'No Listings Found' })).toBeVisible();

    await page.goto(`/searches/${search.id}/approvals`);
    await expect(page.getByRole('heading', { name: 'No Pending Actions' })).toBeVisible();
  });

  test('renders clean API error states without broken UI', async ({ page, request, demoState }) => {
    await demoState.resetAndSeed();
    const search = await createSearch(request, 'Phase 4 API errors');

    await page.route('**/api/searches', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Injected searches error' }),
      });
    });
    await page.goto('/searches');
    await expect(page.getByRole('heading', { name: 'Searches Unavailable' })).toBeVisible();
    await expect(page.locator('main')).toContainText('Injected searches error');
    await page.unroute('**/api/searches');

    await page.route(`**/api/searches/${search.id}/listings*`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Injected listings error' }),
      });
    });
    await page.goto(`/searches/${search.id}/listings`);
    await expect(page.getByRole('heading', { name: 'Listings Unavailable' })).toBeVisible();
    await expect(page.locator('main')).toContainText('Injected listings error');
    await page.unroute(`**/api/searches/${search.id}/listings*`);

    await page.route(`**/api/searches/${search.id}/actions`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Injected actions error' }),
      });
    });
    await page.goto(`/searches/${search.id}/approvals`);
    await expect(page.getByRole('heading', { name: 'Actions Unavailable' })).toBeVisible();
    await expect(page.locator('main')).toContainText('Injected actions error');
  });
});

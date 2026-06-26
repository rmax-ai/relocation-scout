import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '../fixtures.js';

const backendURL = 'http://127.0.0.1:8000';

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
  const createResponse = await request.post(`${backendURL}/api/searches`, {
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
        free_text_preferences: 'Phase 2 deterministic E2E coverage.',
      },
    },
  });

  expect(createResponse.ok()).toBeTruthy();
  return (await createResponse.json()) as CreatedSearch;
}

async function startSearch(
  request: APIRequestContext,
  searchId: string,
): Promise<WorkflowStatusResponse> {
  const startResponse = await request.post(`${backendURL}/api/searches/${searchId}/start`);
  expect(startResponse.ok()).toBeTruthy();
  return (await startResponse.json()) as WorkflowStatusResponse;
}

async function setDemoFailures(
  request: APIRequestContext,
  patch: DemoFailuresPatch,
): Promise<void> {
  const response = await request.post(`${backendURL}/api/demo/failures`, { data: patch });
  expect(response.ok()).toBeTruthy();
}

async function createAndStartSearch(
  request: APIRequestContext,
  name: string,
): Promise<CreatedSearch> {
  const createdSearch = await createSearch(request, name);
  await startSearch(request, createdSearch.id);
  return createdSearch;
}

async function createFailedSearch(
  request: APIRequestContext,
  name: string,
): Promise<CreatedSearch> {
  await setDemoFailures(request, { commute_timeout: true });
  try {
    const createdSearch = await createSearch(request, name);
    const workflow = await startSearch(request, createdSearch.id);
    expect(workflow.status).toBe('failed');
    return createdSearch;
  } finally {
    await setDemoFailures(request, { commute_timeout: false });
  }
}

async function getWorkflowStatus(
  request: APIRequestContext,
  searchId: string,
): Promise<string> {
  const response = await request.get(`${backendURL}/api/searches/${searchId}/workflow`);
  expect(response.ok()).toBeTruthy();
  const workflow = (await response.json()) as WorkflowStatusResponse;
  return workflow.status;
}

test.describe('phase 2 core user flows', () => {
  test('creates a search from the form and lands on overview', async ({ page, demoState }) => {
    await demoState.resetAndSeed();
    const searchName = 'Phase 2 create-from-form search';

    await page.goto('/');
    await page.getByPlaceholder('e.g. Amsterdam rental search').fill(searchName);
    await page.getByPlaceholder('e.g. Downtown, 123 Main St').fill('Amsterdam Centraal');
    await page.getByRole('button', { name: 'Create and Start Search' }).click();

    await expect(page).toHaveURL(/\/searches\/[0-9a-f-]+$/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: searchName })).toBeVisible();
    await expect(page.locator('main')).toContainText('Current step:');
  });

  test('starts a seeded search when applicable', async ({
    page,
    request,
    demoState,
  }) => {
    await demoState.resetAndSeed();
    const search = await createSearch(request, 'Phase 2 seeded-start flow');

    await page.goto(`/searches/${search.id}`);
    await expect(page.getByRole('heading', { name: search.name })).toBeVisible();
    await startSearch(request, search.id);

    await expect
      .poll(() => getWorkflowStatus(request, search.id), { timeout: 20_000 })
      .toBe('awaiting_approval');
    await page.reload();
    await expect(page.locator('main')).toContainText('Current step:');
  });

  test('navigates from overview into listings and approvals', async ({
    page,
    request,
    demoState,
  }) => {
    await demoState.resetAndSeed();
    const search = await createAndStartSearch(request, 'Phase 2 route navigation flow');
    const main = page.locator('main');
    const relatedViews = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Related Views' }) });

    await page.goto(`/searches/${search.id}`);
    await relatedViews.getByRole('link', { name: 'Listings', exact: true }).click();
    await expect(page).toHaveURL(`/searches/${search.id}/listings`);
    await expect(main.getByRole('heading', { name: 'Listings', exact: true })).toBeVisible();

    await page.goto(`/searches/${search.id}`);
    await relatedViews.getByRole('link', { name: 'Approvals', exact: true }).click();
    await expect(page).toHaveURL(`/searches/${search.id}/approvals`);
    await expect(main.getByRole('heading', { name: /Approval Inbox/ })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Approve' })).toBeVisible();
  });

  test('edits and approves a pending action in the approval inbox', async ({
    page,
    request,
    demoState,
  }) => {
    await demoState.resetAndSeed();
    const search = await createAndStartSearch(request, 'Phase 2 approve-edit flow');
    const editedSubject = 'Updated subject from E2E test';
    const editedBody = 'Updated body from deterministic Playwright flow.';

    await page.goto(`/searches/${search.id}/approvals`);
    await expect(page.getByRole('heading', { name: /Approval Inbox/ })).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByPlaceholder('Subject').fill(editedSubject);
    await page.locator('textarea').first().fill(editedBody);
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.locator('main')).toContainText(editedSubject);
    await expect(page.locator('main')).toContainText(editedBody);

    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.locator('main')).toContainText(/History|approved/);
  });

  test('rejects a pending action in the approval inbox', async ({ page, request, demoState }) => {
    await demoState.resetAndSeed();
    const search = await createAndStartSearch(request, 'Phase 2 reject flow');

    await page.goto(`/searches/${search.id}/approvals`);
    await expect(page.getByRole('heading', { name: /Approval Inbox/ })).toBeVisible();
    await page.getByRole('button', { name: 'Reject' }).click();

    await expect(page.locator('main')).toContainText(/History|rejected/);
  });

  test('validates reset, retry, and resume actions on overview', async ({ page, request, demoState }) => {
    await demoState.resetAndSeed();

    const failedSearch = await createFailedSearch(request, 'Phase 2 overview action flow');
    await page.goto(`/searches/${failedSearch.id}`);

    await expect(page.getByRole('button', { name: 'Resume Search' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry Failed Step' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset Search' })).toBeVisible();

    await page.getByRole('button', { name: 'Retry Failed Step' }).click();
    await expect
      .poll(() => getWorkflowStatus(request, failedSearch.id), { timeout: 20_000 })
      .toBe('failed');

    await page.getByRole('button', { name: 'Resume Search' }).click();
    await expect
      .poll(() => getWorkflowStatus(request, failedSearch.id), { timeout: 20_000 })
      .toBe('failed');

    await page.getByRole('button', { name: 'Reset Search' }).click();

    await expect.poll(() => getWorkflowStatus(request, failedSearch.id), { timeout: 20_000 }).toBe('created');
    await expect(page.getByRole('button', { name: 'Resume Search' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Retry Failed Step' })).toHaveCount(0);
  });
});

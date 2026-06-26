import type { APIRequestContext } from '@playwright/test';
import { expect, test } from './fixtures';

const backendURL = 'http://127.0.0.1:8000';

async function createStartedSearch(request: APIRequestContext): Promise<{ id: string; name: string }> {
  const name = 'Route smoke search';
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
        free_text_preferences: 'Smoke test search for main route coverage.',
      },
    },
  });

  expect(createResponse.ok()).toBeTruthy();
  const createdSearch = (await createResponse.json()) as { id: string; name: string };

  const startResponse = await request.post(`${backendURL}/api/searches/${createdSearch.id}/start`);
  expect(startResponse.ok()).toBeTruthy();

  return createdSearch;
}

test.describe('main route smoke coverage', () => {
  test('loads home and searches list routes', async ({ page, demoState }) => {
    await demoState.resetAndSeed();

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Create New Search' })).toBeVisible();

    await page.goto('/searches');
    await expect(page.getByText('No Searches')).toBeVisible();
  });

  test('loads seeded search overview and scoped routes', async ({ page, request, demoState }) => {
    await demoState.resetAndSeed();
    const search = await createStartedSearch(request);
    const main = page.locator('main');

    const routeChecks = [
      {
        path: `/searches/${search.id}`,
        assertVisible: () => expect(main).toContainText(search.name),
      },
      {
        path: `/searches/${search.id}/workflow`,
        assertVisible: () => expect(main).toContainText('Workflow'),
      },
      {
        path: `/searches/${search.id}/listings`,
        assertVisible: () => expect(main).toContainText(/Listings|No Listings Found/),
      },
      {
        path: `/searches/${search.id}/shortlist`,
        assertVisible: () => expect(main).toContainText(/Shortlist|No Shortlist/),
      },
      {
        path: `/searches/${search.id}/approvals`,
        assertVisible: () => expect(main).toContainText(/Approval Inbox|No Pending Actions/),
      },
      {
        path: `/searches/${search.id}/audit`,
        assertVisible: () => expect(main).toContainText(/Audit Log|No Audit Events/),
      },
    ];

    for (const routeCheck of routeChecks) {
      await page.goto(routeCheck.path);
      await routeCheck.assertVisible();
    }
  });

  test('loads dead-end no-context routes', async ({ page, demoState }) => {
    await demoState.resetAndSeed();

    for (const path of ['/workflow', '/listings', '/shortlist', '/approvals', '/audit']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: 'No Context' })).toBeVisible();
    }
  });
});

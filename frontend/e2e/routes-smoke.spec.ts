import { expect, test } from './fixtures.js';
import { createStartedSearch } from './helpers/searches.js';

test.describe('main route smoke coverage', () => {
  test('loads home and searches list routes', async ({ page, demoState }) => {
    await demoState.resetAndSeed();

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Create New Search' })).toBeVisible();

    await page.goto('/searches');
    await expect(page.getByRole('heading', { name: 'No Searches' })).toBeVisible();
  });

  test('loads seeded search overview and scoped routes', async ({ page, request, demoState }) => {
    await demoState.resetAndSeed();
    const search = await createStartedSearch(request, 'Route smoke search');
    const main = page.locator('main');
    const relatedViews = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Related Views' }) });

    await page.goto(`/searches/${search.id}`);
    await expect(main.getByRole('heading', { name: search.name })).toBeVisible();

    const routeChecks: Array<{ linkName: string; path: string; expected: RegExp }> = [
      {
        linkName: 'Workflow',
        path: `/searches/${search.id}/workflow`,
        expected: /Workflow|No Workflow Data|Workflow Unavailable/,
      },
      {
        linkName: 'Listings',
        path: `/searches/${search.id}/listings`,
        expected: /Listings|No Listings Found/,
      },
      {
        linkName: 'Shortlist',
        path: `/searches/${search.id}/shortlist`,
        expected: /Shortlist|No Shortlist/,
      },
      {
        linkName: 'Approvals',
        path: `/searches/${search.id}/approvals`,
        expected: /Approval Inbox|No Pending Actions/,
      },
      {
        linkName: 'Audit Log',
        path: `/searches/${search.id}/audit`,
        expected: /Audit Log|No Audit Events/,
      },
    ];

    for (const route of routeChecks) {
      await page.goto(`/searches/${search.id}`);
      await relatedViews.getByRole('link', { name: route.linkName, exact: true }).click();
      await expect(page).toHaveURL(route.path);
      await expect(main).toContainText(route.expected);
    }
  });

  test('loads dead-end no-context routes', async ({ page, demoState }) => {
    await demoState.resetAndSeed();

    const deadEnds: Array<{ path: string; contextLabel: string }> = [
      { path: '/workflow', contextLabel: 'workflow' },
      { path: '/listings', contextLabel: 'listings' },
      { path: '/shortlist', contextLabel: 'shortlist' },
      { path: '/approvals', contextLabel: 'approvals' },
      { path: '/audit', contextLabel: 'audit log' },
    ];

    for (const route of deadEnds) {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { name: 'No Context' })).toBeVisible();
      await expect(page.locator('main')).toContainText(`Select a search first to view its ${route.contextLabel}.`);
    }
  });
});

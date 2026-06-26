import { expect, test } from '../fixtures.js';
import { expectCoreLandmarks, expectMainHeading } from '../helpers/a11y.js';
import { createStartedSearch } from '../helpers/searches.js';

test.describe('mobile viewport smoke coverage', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('loads shell landmarks and searches screen on mobile viewport', async ({ page, demoState }) => {
    await demoState.resetAndSeed();
    await page.goto('/searches');

    await expectCoreLandmarks(page);
    await expectMainHeading(page, 'No Searches');
    await expect(page.getByRole('button', { name: 'Create New Search' })).toBeVisible();
  });

  test('navigates related views from search overview on mobile viewport', async ({ page, request, demoState }) => {
    await demoState.resetAndSeed();
    const search = await createStartedSearch(request, 'Mobile smoke search');
    const main = page.getByRole('main');

    await page.goto(`/searches/${search.id}`);
    await expectMainHeading(page, search.name);

    await main.getByRole('link', { name: 'Listings', exact: true }).click();
    await expect(page).toHaveURL(`/searches/${search.id}/listings`);
    await expectMainHeading(page, 'Listings');

    await page.goto(`/searches/${search.id}/shortlist`);
    await expect(page).toHaveURL(`/searches/${search.id}/shortlist`);
    await expect(main).toContainText(/Shortlist|No Shortlist/);
  });
});

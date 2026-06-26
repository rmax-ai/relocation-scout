import { expect, test } from '../fixtures.js';
import { expectCoreLandmarks, expectMainHeading } from '../helpers/a11y.js';
import { createStartedSearch } from '../helpers/searches.js';

test.describe('basic accessibility assertions for key pages', () => {
  test('searches page exposes landmarks and named navigation controls', async ({ page, demoState }) => {
    await demoState.resetAndSeed();
    await page.goto('/searches');

    await expectCoreLandmarks(page);
    await expectMainHeading(page, 'No Searches');
    await expect(page.getByRole('button', { name: 'Create New Search' })).toBeVisible();

    const navigation = page.getByRole('navigation');
    await expect(navigation.getByRole('link', { name: 'New Search' })).toBeVisible();
    await expect(navigation.getByRole('link', { name: 'Searches' })).toBeVisible();
    await expect(navigation.getByRole('link', { name: 'Workflow' })).toBeVisible();
  });

  test('search detail and listings pages expose semantic headings and table structure', async ({ page, request, demoState }) => {
    await demoState.resetAndSeed();
    const search = await createStartedSearch(request, 'A11y baseline search');
    const main = page.getByRole('main');

    await page.goto(`/searches/${search.id}`);

    await expectCoreLandmarks(page);
    await expectMainHeading(page, search.name);

    await expect(main.getByRole('link', { name: 'Workflow', exact: true })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Listings', exact: true })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Shortlist', exact: true })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Approvals', exact: true })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Audit Log', exact: true })).toBeVisible();

    await main.getByRole('link', { name: 'Listings', exact: true }).click();
    await expect(page).toHaveURL(`/searches/${search.id}/listings`);
    await expectMainHeading(page, 'Listings');

    await expect(main.getByRole('combobox')).toHaveCount(4);

    const table = main.getByRole('table');
    if (await table.count()) {
      await expect(table).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'Title' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'Neighbourhood' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'Rent' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    } else {
      await expectMainHeading(page, 'No Listings Found');
    }
  });
});

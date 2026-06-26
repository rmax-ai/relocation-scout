import { expect, test } from '../fixtures.js';

const searchId = 'phase-3-listings-search';
const mockedListings = [
  {
    id: 'listing-001',
    title: 'Canal Loft',
    address: 'Prinsengracht 100',
    neighbourhood: 'Centrum',
    rent: 2300,
    bedrooms: 2,
    area_sqm: 74,
    commute_minutes: 22,
    score: 91,
    status: 'passed',
    recommendation: 'recommended',
    has_suspicious_content: false,
    suspicious_content_types: [],
  },
  {
    id: 'listing-002',
    title: 'West Garden Flat',
    address: 'Jan van Galenstraat 20',
    neighbourhood: 'West',
    rent: 2100,
    bedrooms: 2,
    area_sqm: 68,
    commute_minutes: 27,
    score: 84,
    status: 'passed',
    recommendation: 'neutral',
    has_suspicious_content: true,
    suspicious_content_types: ['instruction_like_content'],
  },
  {
    id: 'listing-003',
    title: 'South Family Home',
    address: 'Beethovenstraat 45',
    neighbourhood: 'Zuid',
    rent: 2800,
    bedrooms: 3,
    area_sqm: 98,
    commute_minutes: 36,
    score: 58,
    status: 'rejected',
    recommendation: 'not_recommended',
    has_suspicious_content: false,
    suspicious_content_types: [],
  },
];

test.describe('phase 3 listings page behavior', () => {
  test('filters listings, updates result count, shows suspicious indicators, and navigates to details', async ({
    page,
    demoState,
  }) => {
    await demoState.resetAndSeed();

    await page.route(`**/api/searches/${searchId}/listings*`, async (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      const recommendation = url.searchParams.get('recommendation');
      const neighbourhood = url.searchParams.get('neighbourhood');
      const suspicious = url.searchParams.get('has_suspicious_content');

      const filtered = mockedListings.filter((listing) => {
        if (status && listing.status !== status) {
          return false;
        }
        if (recommendation && listing.recommendation !== recommendation) {
          return false;
        }
        if (neighbourhood && listing.neighbourhood !== neighbourhood) {
          return false;
        }
        if (suspicious !== null && String(listing.has_suspicious_content) !== suspicious) {
          return false;
        }
        return true;
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    });

    await page.goto(`/searches/${searchId}/listings`);

    await expect(page.getByRole('heading', { name: 'Listings' })).toBeVisible();
    await expect(page.getByText('3 results')).toBeVisible();
    await expect(page.locator('tbody tr').filter({ hasText: 'West Garden Flat' }).getByText('⚠')).toBeVisible();

    await page.locator('select').nth(0).selectOption('passed');
    await expect(page.getByText('2 results')).toBeVisible();

    await page.locator('select').nth(3).selectOption('true');
    await expect(page.getByText('1 results')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr').first()).toContainText('West Garden Flat');

    await page.getByRole('link', { name: 'Detail' }).click();
    await expect(page).toHaveURL(`/searches/${searchId}/listings/listing-002`);
  });
});

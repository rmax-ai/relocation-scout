import { expect, test } from '../fixtures.js';

const searchId = 'phase-3-shortlist-search';

const shortlistPayload = {
  search_id: searchId,
  entries: [
    {
      rank: 1,
      listing_id: 'short-001',
      title: 'Canal Apartment',
      address: 'Prinsengracht 1',
      neighbourhood: 'Centrum',
      monthly_rent_eur: 2100,
      commute_minutes: 24,
      overall_score: 0.87,
      evaluation: {
        listing_id: 'short-001',
        hard_constraints_passed: true,
        affordability_score: 0.7,
        commute_score: 0.85,
        neighbourhood_score: 0.9,
        qualitative_fit_score: 0.8,
        overall_score: 0.87,
        strengths: ['Transit access'],
        concerns: ['Pricey'],
        recommendation: 'strong_match',
        evidence_ids: ['source-1'],
        agent_explanation: 'Top overall balance for commute and neighbourhood quality.',
        is_qualitative: true,
      },
    },
    {
      rank: 2,
      listing_id: 'short-002',
      title: 'Parkside Flat',
      address: 'Vondelstraat 12',
      neighbourhood: 'West',
      monthly_rent_eur: 1980,
      commute_minutes: 29,
      overall_score: 0.79,
      evaluation: {
        listing_id: 'short-002',
        hard_constraints_passed: true,
        affordability_score: 0.76,
        commute_score: 0.75,
        neighbourhood_score: 0.81,
        qualitative_fit_score: 0.79,
        overall_score: 0.79,
        strengths: ['Near parks'],
        concerns: ['Smaller unit'],
        recommendation: 'possible_match',
        evidence_ids: ['source-2'],
        agent_explanation: 'Good fallback option with solid affordability.',
        is_qualitative: true,
      },
    },
  ],
  summary: 'Two strong options identified.',
  comparison_notes: '',
};

test.describe('phase 3 shortlist page behavior', () => {
  test('renders shortlist visibility and ranking presentation', async ({ page, demoState }) => {
    await demoState.resetAndSeed();

    await page.route(`**/api/searches/${searchId}/shortlist`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(shortlistPayload),
      });
    });

    await page.goto(`/searches/${searchId}/shortlist`);

    await expect(page.getByRole('heading', { name: 'Shortlist' })).toBeVisible();
    await expect(page.getByText('2 recommendations')).toBeVisible();
    await expect(page.locator('main')).toContainText('#1');
    await expect(page.locator('main')).toContainText('#2');

    const shortlistTitles = page.locator('h3.font-medium.text-slate-200');
    await expect(shortlistTitles.nth(0)).toHaveText('Canal Apartment');
    await expect(shortlistTitles.nth(1)).toHaveText('Parkside Flat');
    await expect(page.locator('main')).toContainText('87');
    await expect(page.locator('main')).toContainText('79');
  });
});

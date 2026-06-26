import { expect, test } from './fixtures';

test.describe('app shell', () => {
  test('renders the empty searches state against the mock backend', async ({ page, demoState }) => {
    await demoState.resetAndSeed();

    await page.goto('/searches');

    await expect(page.getByText('No Searches')).toBeVisible();
    await expect(page.getByText('Create your first search to get started.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create New Search' })).toBeVisible();
  });
});

import { expect, test } from '../fixtures.js';

const searchId = 'phase-3-audit-search';

const auditEvents = [
  {
    id: 'evt-003',
    timestamp: '2026-06-26T10:00:30Z',
    event_type: 'workflow.failed',
    actor: 'system',
    workflow_step: 'deduplicate_listings',
    entity_type: 'workflow',
    entity_id: searchId,
    message: 'Workflow failed due to timeout.',
    metadata: {},
  },
  {
    id: 'evt-002',
    timestamp: '2026-06-26T10:00:20Z',
    event_type: 'workflow.step_started',
    actor: 'deterministic',
    workflow_step: 'calculate_commutes',
    entity_type: 'workflow_step',
    entity_id: 'calculate_commutes',
    message: 'Commute calculation started.',
    metadata: {},
  },
  {
    id: 'evt-001',
    timestamp: '2026-06-26T10:00:10Z',
    event_type: 'workflow.started',
    actor: 'system',
    workflow_step: 'fetch_listings',
    entity_type: 'workflow',
    entity_id: searchId,
    message: 'Workflow started.',
    metadata: {},
  },
];

test.describe('phase 3 audit page behavior', () => {
  test('renders audit events in order and applies event-type filtering', async ({
    page,
    demoState,
  }) => {
    await demoState.resetAndSeed();

    await page.route(`**/api/searches/${searchId}/audit/export`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: auditEvents,
          total: auditEvents.length,
          search_id: searchId,
        }),
      });
    });

    await page.route(`**/api/searches/${searchId}/audit?*`, async (route) => {
      const url = new URL(route.request().url());
      const eventType = url.searchParams.get('event_type');

      const filtered = eventType
        ? auditEvents.filter((event) => event.event_type === eventType)
        : auditEvents;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    });

    await page.route(`**/api/searches/${searchId}/audit`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(auditEvents),
      });
    });

    await page.goto(`/searches/${searchId}/audit`);

    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible();
    await expect(page.getByText('3 events')).toBeVisible();

    const messageCells = page.locator('main div.text-xs.text-slate-300.flex-1');
    await expect(messageCells).toHaveCount(3);
    await expect(messageCells.nth(0)).toHaveText('Workflow failed due to timeout.');
    await expect(messageCells.nth(1)).toHaveText('Commute calculation started.');
    await expect(messageCells.nth(2)).toHaveText('Workflow started.');

    await page.locator('select').nth(0).selectOption('workflow.failed');
    await expect(messageCells).toHaveCount(1);
    await expect(messageCells.first()).toHaveText('Workflow failed due to timeout.');
  });
});

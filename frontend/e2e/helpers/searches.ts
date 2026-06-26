import type { APIRequestContext } from '@playwright/test';
import { expect } from '../fixtures.js';

const backendURL = 'http://127.0.0.1:8000';

export async function createStartedSearch(
  request: APIRequestContext,
  name = 'Playwright hardening search',
): Promise<{ id: string; name: string }> {
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
        free_text_preferences: 'Playwright hardening search fixture.',
      },
    },
  });

  expect(createResponse.ok()).toBeTruthy();
  const createdSearch = (await createResponse.json()) as { id: string; name: string };

  const startResponse = await request.post(`${backendURL}/api/searches/${createdSearch.id}/start`);
  expect(startResponse.ok()).toBeTruthy();

  return createdSearch;
}

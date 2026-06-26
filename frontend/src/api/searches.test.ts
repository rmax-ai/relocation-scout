import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from './client';
import { searchesApi } from './searches';

describe('searchesApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates searches with the backend request contract', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'search-1',
          name: 'Amsterdam rental search',
          status: 'created',
          created_at: '2026-06-26T10:00:00Z',
          updated_at: '2026-06-26T10:00:00Z',
          preferences: {
            max_monthly_rent_eur: 2000,
            minimum_bedrooms: 2,
            minimum_area_m2: 50,
            destination_address: 'Centraal Station',
            max_commute_minutes: 45,
            preferred_neighbourhoods: ['West'],
            excluded_neighbourhoods: ['Noord'],
            priorities: {
              quiet: 0.25,
              transport: 0.25,
              green_space: 0.25,
              affordability: 0.25,
            },
            free_text_preferences: 'Near a park',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const result = await searchesApi.create({
      name: 'Amsterdam rental search',
      preferences: {
        max_rent: 2000,
        min_bedrooms: 2,
        min_area: 50,
        commute_destination: 'Centraal Station',
        max_commute_minutes: 45,
        preferred_neighbourhoods: ['West'],
        excluded_neighbourhoods: ['Noord'],
        priorities: {
          quiet: 25,
          transport: 25,
          green_space: 25,
          affordability: 25,
        },
        preferences_text: 'Near a park',
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/searches',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Amsterdam rental search',
          preferences: {
            max_monthly_rent_eur: 2000,
            minimum_bedrooms: 2,
            minimum_area_m2: 50,
            destination_address: 'Centraal Station',
            max_commute_minutes: 45,
            preferred_neighbourhoods: ['West'],
            excluded_neighbourhoods: ['Noord'],
            priorities: {
              quiet: 0.25,
              transport: 0.25,
              green_space: 0.25,
              affordability: 0.25,
            },
            free_text_preferences: 'Near a park',
          },
        }),
      }),
    );
    expect(result.preferences).toEqual({
      max_rent: 2000,
      min_bedrooms: 2,
      min_area: 50,
      commute_destination: 'Centraal Station',
      max_commute_minutes: 45,
      preferred_neighbourhoods: ['West'],
      excluded_neighbourhoods: ['Noord'],
      priorities: {
        quiet: 25,
        transport: 25,
        green_space: 25,
        affordability: 25,
      },
      preferences_text: 'Near a park',
    });
  });

  it('formats backend validation errors into readable text', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: [
            { loc: ['body', 'name'], msg: 'Field required' },
            { loc: ['body', 'preferences'], msg: 'Field required' },
          ],
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await expect(
      searchesApi.create({
        name: '',
        preferences: {
          max_rent: 2000,
          min_bedrooms: 2,
          min_area: 50,
          commute_destination: '',
          max_commute_minutes: 45,
          preferred_neighbourhoods: [],
          excluded_neighbourhoods: [],
          priorities: {
            quiet: 25,
            transport: 25,
            green_space: 25,
            affordability: 25,
          },
          preferences_text: '',
        },
      }),
    ).rejects.toMatchObject({
      message: 'body.name: Field required; body.preferences: Field required',
      status: 422,
    } satisfies Partial<ApiError>);
  });

  it('returns workflow start metadata separately from created search records', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'search-1',
            name: 'Amsterdam rental search',
            status: 'created',
            created_at: '2026-06-26T10:00:00Z',
            updated_at: '2026-06-26T10:00:00Z',
            preferences: {
              max_monthly_rent_eur: 2000,
              minimum_bedrooms: 2,
              minimum_area_m2: 50,
              destination_address: 'Centraal Station',
              max_commute_minutes: 45,
              preferred_neighbourhoods: [],
              excluded_neighbourhoods: [],
              priorities: {
                quiet: 0.25,
                transport: 0.25,
                green_space: 0.25,
                affordability: 0.25,
              },
              free_text_preferences: null,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            search_id: 'search-1',
            status: 'running',
            current_step: 'fetch_listings',
            completed_steps: [],
            retry_count: 0,
            resumable: true,
            created_at: '2026-06-26T10:00:00Z',
            updated_at: '2026-06-26T10:00:01Z',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

    const created = await searchesApi.create({
      name: 'Amsterdam rental search',
      preferences: {
        max_rent: 2000,
        min_bedrooms: 2,
        min_area: 50,
        commute_destination: 'Centraal Station',
        max_commute_minutes: 45,
        preferred_neighbourhoods: [],
        excluded_neighbourhoods: [],
        priorities: {
          quiet: 25,
          transport: 25,
          green_space: 25,
          affordability: 25,
        },
        preferences_text: '',
      },
    });

    const started = await searchesApi.start(created.id);

    expect(created.id).toBe('search-1');
    expect(started).toMatchObject({ search_id: 'search-1', status: 'running' });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/searches/search-1/start',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

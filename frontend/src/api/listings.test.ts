import { afterEach, describe, expect, it, vi } from 'vitest';

import { listingsApi } from './listings';

describe('listingsApi.shortlist', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps backend shortlist payloads into frontend shortlist entries', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          search_id: 'search-1',
          entries: [
            {
              rank: 1,
              listing_id: 'listing-1',
              title: 'Canal Apartment',
              address: 'Prinsengracht 1',
              neighbourhood: 'Centrum',
              monthly_rent_eur: 2100,
              commute_minutes: 24,
              overall_score: 0.87,
              evaluation: {
                listing_id: 'listing-1',
                hard_constraints_passed: true,
                affordability_score: 0.7,
                commute_score: 0.85,
                neighbourhood_score: 0.9,
                qualitative_fit_score: 0.8,
                overall_score: 0.87,
                strengths: ['Transit access'],
                concerns: ['Pricey'],
                recommendation: 'strong_match',
                evidence_ids: ['source-1', 'source-2'],
                agent_explanation: 'Best balance of commute and neighbourhood quality.',
                is_qualitative: true,
              },
            },
          ],
          summary: 'Top pick identified.',
          comparison_notes: '',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const shortlist = await listingsApi.shortlist('search-1');

    expect(shortlist).toEqual([
      {
        listing_id: 'listing-1',
        listing: {
          id: 'listing-1',
          provider_id: 'listing-1',
          title: 'Canal Apartment',
          address: 'Prinsengracht 1',
          neighbourhood: 'Centrum',
          rent: 2100,
          bedrooms: 0,
          area_sqm: 0,
          commute_minutes: 24,
          score: 87,
          recommendation: 'Highly recommended',
          status: 'passed',
          has_suspicious_content: false,
          suspicious_content_types: [],
          created_at: '',
        },
        rank: 1,
        score: 87,
        commute_rating: '85%',
        affordability_rating: '70%',
        neighbourhood_fit_rating: '90%',
        explanation: 'Best balance of commute and neighbourhood quality.',
        evidence_links: ['source-1', 'source-2'],
      },
    ]);
  });

  it('returns an empty shortlist when the backend has no entries yet', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          search_id: 'search-1',
          entries: [],
          summary: 'Shortlist being generated...',
          comparison_notes: '',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const shortlist = await listingsApi.shortlist('search-1');

    expect(shortlist).toEqual([]);
  });
});

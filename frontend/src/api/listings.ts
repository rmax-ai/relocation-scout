import { api } from './client';
import type { Listing, ListingDetail, ShortlistEntry } from '../types';

type BackendShortlistEntry = {
  rank: number;
  listing_id: string;
  title: string;
  address: string;
  neighbourhood: string;
  monthly_rent_eur: number;
  commute_minutes: number;
  overall_score: number;
  evaluation: {
    listing_id: string;
    hard_constraints_passed: boolean;
    affordability_score: number;
    commute_score: number;
    neighbourhood_score: number;
    qualitative_fit_score: number;
    overall_score: number;
    strengths: string[];
    concerns: string[];
    recommendation: string;
    evidence_ids: string[];
    agent_explanation: string;
    is_qualitative: boolean;
  };
};

type BackendShortlistResponse = {
  search_id: string;
  entries: BackendShortlistEntry[];
  summary: string;
  comparison_notes: string;
};

function toFrontendShortlistEntry(entry: BackendShortlistEntry): ShortlistEntry {
  const recommendation =
    entry.evaluation.recommendation === 'strong_match'
      ? 'Highly recommended'
      : entry.evaluation.recommendation === 'possible_match'
        ? 'Worth considering'
        : entry.evaluation.recommendation === 'weak_match'
          ? 'Weak fit'
          : 'Reject';

  const listing: Listing = {
    id: entry.listing_id,
    provider_id: entry.listing_id,
    title: entry.title,
    address: entry.address,
    neighbourhood: entry.neighbourhood,
    rent: entry.monthly_rent_eur,
    bedrooms: 0,
    area_sqm: 0,
    commute_minutes: entry.commute_minutes,
    score: Math.round(entry.overall_score * 100),
    recommendation,
    status: 'passed',
    has_suspicious_content: false,
    suspicious_content_types: [],
    created_at: '',
  };

  return {
    listing_id: entry.listing_id,
    listing,
    rank: entry.rank,
    score: listing.score,
    commute_rating: `${Math.round(entry.evaluation.commute_score * 100)}%`,
    affordability_rating: `${Math.round(entry.evaluation.affordability_score * 100)}%`,
    neighbourhood_fit_rating: `${Math.round(entry.evaluation.neighbourhood_score * 100)}%`,
    explanation: entry.evaluation.agent_explanation,
    evidence_links: entry.evaluation.evidence_ids,
  };
}

export const listingsApi = {
  list: (searchId: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<Listing[]>(`/api/searches/${searchId}/listings${query}`);
  },

  get: (searchId: string, listingId: string) =>
    api.get<ListingDetail>(`/api/searches/${searchId}/listings/${listingId}`),

  shortlist: async (searchId: string) => {
    const shortlist = await api.get<BackendShortlistResponse>(`/api/searches/${searchId}/shortlist`);
    return shortlist.entries.map(toFrontendShortlistEntry);
  },
};

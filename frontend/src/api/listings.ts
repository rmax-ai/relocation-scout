import { api } from './client';
import type { Listing, ListingDetail, ShortlistEntry } from '../types';

export const listingsApi = {
  list: (searchId: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<Listing[]>(`/api/searches/${searchId}/listings${query}`);
  },

  get: (searchId: string, listingId: string) =>
    api.get<ListingDetail>(`/api/searches/${searchId}/listings/${listingId}`),

  shortlist: (searchId: string) =>
    api.get<ShortlistEntry[]>(`/api/searches/${searchId}/shortlist`),
};

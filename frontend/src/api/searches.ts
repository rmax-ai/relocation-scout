import { api } from './client';
import type { Search, SearchPreferences, SearchSummary } from '../types';

type BackendPriorityWeights = {
  quiet: number;
  transport: number;
  green_space: number;
  affordability: number;
};

type BackendSearchPreferences = {
  max_monthly_rent_eur: number;
  minimum_bedrooms: number;
  minimum_area_m2: number | null;
  destination_address: string;
  max_commute_minutes: number;
  preferred_neighbourhoods: string[];
  excluded_neighbourhoods: string[];
  priorities: BackendPriorityWeights;
  free_text_preferences: string | null;
};

type BackendSearch = {
  id: string;
  name: string;
  status: Search['status'];
  created_at: string;
  updated_at: string;
  preferences: BackendSearchPreferences;
};

type CreateSearchRequest = {
  name: string;
  preferences: SearchPreferences;
};

function normalizePriorities(priorities: SearchPreferences['priorities']): BackendPriorityWeights {
  return {
    quiet: priorities.quiet / 100,
    transport: priorities.transport / 100,
    green_space: priorities.green_space / 100,
    affordability: priorities.affordability / 100,
  };
}

function denormalizePriorities(priorities: BackendPriorityWeights): SearchPreferences['priorities'] {
  return {
    quiet: Math.round(priorities.quiet * 100),
    transport: Math.round(priorities.transport * 100),
    green_space: Math.round(priorities.green_space * 100),
    affordability: Math.round(priorities.affordability * 100),
  };
}

function toBackendPreferences(preferences: SearchPreferences): BackendSearchPreferences {
  return {
    max_monthly_rent_eur: preferences.max_rent,
    minimum_bedrooms: preferences.min_bedrooms,
    minimum_area_m2: preferences.min_area,
    destination_address: preferences.commute_destination,
    max_commute_minutes: preferences.max_commute_minutes,
    preferred_neighbourhoods: preferences.preferred_neighbourhoods,
    excluded_neighbourhoods: preferences.excluded_neighbourhoods,
    priorities: normalizePriorities(preferences.priorities),
    free_text_preferences: preferences.preferences_text || null,
  };
}

function toFrontendPreferences(preferences: BackendSearchPreferences): SearchPreferences {
  return {
    max_rent: preferences.max_monthly_rent_eur,
    min_bedrooms: preferences.minimum_bedrooms,
    min_area: preferences.minimum_area_m2 ?? 0,
    commute_destination: preferences.destination_address,
    max_commute_minutes: preferences.max_commute_minutes,
    preferred_neighbourhoods: preferences.preferred_neighbourhoods,
    excluded_neighbourhoods: preferences.excluded_neighbourhoods,
    priorities: denormalizePriorities(preferences.priorities),
    preferences_text: preferences.free_text_preferences ?? '',
  };
}

function toFrontendSearch(search: BackendSearch): Search {
  return {
    id: search.id,
    name: search.name,
    status: search.status,
    created_at: search.created_at,
    updated_at: search.updated_at,
    preferences: toFrontendPreferences(search.preferences),
    progress_percentage: search.status === 'completed' ? 100 : 0,
    current_step: '',
    completed_at: search.status === 'completed' ? search.updated_at : null,
  };
}

function toFrontendSearchSummary(search: BackendSearch): SearchSummary {
  const normalized = toFrontendSearch(search);
  return {
    id: normalized.id,
    name: normalized.name,
    status: normalized.status,
    progress_percentage: normalized.progress_percentage,
    current_step: normalized.current_step,
    created_at: normalized.created_at,
  };
}

export const searchesApi = {
  list: async () => {
    const searches = await api.get<BackendSearch[]>('/api/searches');
    return searches.map(toFrontendSearchSummary);
  },

  get: async (id: string) => {
    const search = await api.get<BackendSearch>(`/api/searches/${id}`);
    return toFrontendSearch(search);
  },

  create: async ({ name, preferences }: CreateSearchRequest) => {
    const search = await api.post<BackendSearch>('/api/searches', {
      name,
      preferences: toBackendPreferences(preferences),
    });
    return toFrontendSearch(search);
  },

  start: (id: string) => api.post<Search>(`/api/searches/${id}/start`),

  resume: (id: string) => api.post<Search>(`/api/searches/${id}/resume`),

  reset: (id: string) => api.post<Search>(`/api/searches/${id}/reset`),
};

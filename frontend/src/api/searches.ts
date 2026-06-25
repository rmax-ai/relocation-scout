import { api } from './client';
import type { Search, SearchPreferences, SearchSummary } from '../types';

export const searchesApi = {
  list: () => api.get<SearchSummary[]>('/api/searches'),

  get: (id: string) => api.get<Search>(`/api/searches/${id}`),

  create: (preferences: SearchPreferences) =>
    api.post<Search>('/api/searches', preferences),

  start: (id: string) => api.post<Search>(`/api/searches/${id}/start`),

  resume: (id: string) => api.post<Search>(`/api/searches/${id}/resume`),

  reset: (id: string) => api.post<Search>(`/api/searches/${id}/reset`),
};

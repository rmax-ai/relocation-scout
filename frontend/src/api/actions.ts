import { api } from './client';
import type { Action } from '../types';

export const actionsApi = {
  list: (searchId: string) =>
    api.get<Action[]>(`/api/searches/${searchId}/actions`),

  get: (id: string) => api.get<Action>(`/api/actions/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch<Action>(`/api/actions/${id}`, data),

  approve: (id: string) =>
    api.post<Action>(`/api/actions/${id}/approve`),

  reject: (id: string, reason?: string) =>
    api.post<Action>(`/api/actions/${id}/reject`, reason ? { reason } : undefined),

  execute: (id: string) =>
    api.post<Action>(`/api/actions/${id}/execute`),
};

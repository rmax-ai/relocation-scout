import { api } from './client';
import type { WorkflowState } from '../types';

export const workflowApi = {
  get: (searchId: string) =>
    api.get<WorkflowState>(`/api/searches/${searchId}/workflow`),

  getSteps: (searchId: string) =>
    api.get(`/api/searches/${searchId}/workflow/steps`),

  retry: (searchId: string) =>
    api.post<WorkflowState>(`/api/searches/${searchId}/workflow/retry`),
};

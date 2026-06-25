import { api } from './client';
import type { DemoFailures } from '../types';

export const demoApi = {
  seed: () => api.post<{ message: string }>('/api/demo/seed'),

  reset: () => api.post<{ message: string }>('/api/demo/reset'),

  getFailures: () => api.get<DemoFailures>('/api/demo/failures'),

  setFailures: (failures: Partial<DemoFailures>) =>
    api.post<DemoFailures>('/api/demo/failures', failures),
};

import { api } from './client';
import type { Health, Metrics } from '../types';

export const healthApi = {
  get: () => api.get<Health>('/api/health'),
  metrics: () => api.get<Metrics>('/api/metrics'),
};

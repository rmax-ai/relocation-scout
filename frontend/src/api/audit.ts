import { api } from './client';
import type { AuditEvent, AuditExport } from '../types';

export const auditApi = {
  list: (searchId: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<AuditEvent[]>(`/api/searches/${searchId}/audit${query}`);
  },

  export: (searchId: string) =>
    api.get<AuditExport>(`/api/searches/${searchId}/audit/export`),
};

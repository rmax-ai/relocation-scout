import { api } from './client';
import type { Action } from '../types';

type BackendActionResponse = {
  action_id: string;
  action_type: string;
  target_listing_id: string;
  payload: Record<string, unknown>;
  payload_hash: string;
  idempotency_key: string;
  risk_level: string;
  status: string;
  created_at: string | null;
};

type ActionUpdateRequest = {
  payload: {
    recipient: string;
    subject: string;
    body: string;
  };
};

function mapActionType(actionType: string): Action['action_type'] {
  if (
    actionType === 'email_realtor' ||
    actionType === 'phone_call' ||
    actionType === 'book_viewing' ||
    actionType === 'send_inquiry'
  ) {
    return actionType;
  }

  return 'send_inquiry';
}

function mapActionStatus(status: string): Action['status'] {
  if (status === 'draft') {
    return 'pending';
  }
  if (
    status === 'pending' ||
    status === 'approved' ||
    status === 'rejected' ||
    status === 'executing' ||
    status === 'completed' ||
    status === 'failed'
  ) {
    return status;
  }

  return 'pending';
}

function mapRiskLevel(level: string): Action['risk_level'] {
  if (level === 'low' || level === 'medium' || level === 'high') {
    return level;
  }
  return 'low';
}

function parseString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toFrontendAction(
  backendAction: BackendActionResponse,
  searchId: string,
): Action {
  const payload = backendAction.payload ?? {};
  const recipient = parseString(payload.recipient);
  const subject = parseString(payload.subject);
  const body = parseString(payload.body);
  const listingTitleFallback = backendAction.target_listing_id
    ? `Listing ${backendAction.target_listing_id.slice(0, 8)}`
    : 'Listing';
  const createdAt = backendAction.created_at ?? new Date().toISOString();

  return {
    id: backendAction.action_id,
    search_id: searchId,
    action_type: mapActionType(backendAction.action_type),
    listing_id: backendAction.target_listing_id,
    listing_title: subject || listingTitleFallback,
    recipient,
    subject,
    body,
    risk_level: mapRiskLevel(backendAction.risk_level),
    status: mapActionStatus(backendAction.status),
    payload_hash: backendAction.payload_hash,
    idempotency_key: backendAction.idempotency_key,
    created_at: createdAt,
    updated_at: createdAt,
    approved_at: null,
    executed_at: null,
    failure_reason: null,
  };
}

export const actionsApi = {
  list: (searchId: string) =>
    api
      .get<BackendActionResponse[]>(`/api/searches/${searchId}/actions`)
      .then((actions) => actions.map((action) => toFrontendAction(action, searchId))),

  get: (id: string, searchId = '') =>
    api
      .get<BackendActionResponse>(`/api/actions/${id}`)
      .then((action) => toFrontendAction(action, searchId)),

  update: (id: string, data: ActionUpdateRequest) =>
    api.patch<BackendActionResponse>(`/api/actions/${id}`, data),

  approve: (id: string, approvedBy = 'demo_user', comment?: string) =>
    api.post(`/api/actions/${id}/approve`, { approved_by: approvedBy, comment }),

  reject: (id: string, approvedBy = 'demo_user', comment?: string) =>
    api.post(`/api/actions/${id}/reject`, { approved_by: approvedBy, comment }),

  execute: (id: string) =>
    api.post(`/api/actions/${id}/execute`),
};

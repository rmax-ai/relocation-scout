function getApiBase(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:8000';
  }

  return '';
}

const API_BASE = getApiBase();

function formatValidationDetail(detail: unknown): string | null {
  if (typeof detail === 'string') {
    return detail;
  }

  if (!Array.isArray(detail)) {
    return null;
  }

  const messages = detail
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const loc = Array.isArray((item as Record<string, unknown>).loc)
        ? ((item as Record<string, unknown>).loc as unknown[])
            .map((part) => String(part))
            .join('.')
        : 'request';
      const msg =
        typeof (item as Record<string, unknown>).msg === 'string'
          ? (item as Record<string, unknown>).msg
          : 'Invalid request';

      return `${loc}: ${msg}`;
    })
    .filter((message): message is string => Boolean(message));

  return messages.length > 0 ? messages.join('; ') : null;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    throw new ApiError(
      response.status,
      data && typeof data === 'object' && 'detail' in data
        ? formatValidationDetail((data as Record<string, unknown>).detail) ?? `HTTP ${response.status}`
        : `HTTP ${response.status}`,
      data,
    );
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
};

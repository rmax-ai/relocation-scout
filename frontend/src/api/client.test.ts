import { afterEach, describe, expect, it, vi } from 'vitest';

describe('api client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('uses relative api paths in the browser when no explicit base URL is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ready' }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { api } = await import('./client');

    await api.post('/api/demo/seed');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/demo/seed',
      expect.objectContaining({
        method: 'POST',
        body: undefined,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });
});

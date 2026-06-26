import type { APIRequestContext } from '@playwright/test';

const backendURL = 'http://127.0.0.1:8000';

async function postDemoEndpoint(request: APIRequestContext, path: string): Promise<void> {
  const response = await request.post(`${backendURL}${path}`);

  if (response.ok()) {
    return;
  }

  throw new Error(`Failed POST ${path}: ${response.status()} ${await response.text()}`);
}

export async function resetDemoState(request: APIRequestContext): Promise<void> {
  await postDemoEndpoint(request, '/api/demo/reset');
}

export async function seedDemoState(request: APIRequestContext): Promise<void> {
  await postDemoEndpoint(request, '/api/demo/seed');
}

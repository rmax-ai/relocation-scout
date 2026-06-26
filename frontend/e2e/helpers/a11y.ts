import type { Page } from '@playwright/test';
import { expect } from '../fixtures.js';

export async function expectCoreLandmarks(page: Page): Promise<void> {
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Relocation Scout' })).toBeVisible();
}

export async function expectMainHeading(page: Page, name: string | RegExp): Promise<void> {
  const heading =
    typeof name === 'string'
      ? page.getByRole('main').getByRole('heading', { name, exact: true })
      : page.getByRole('main').getByRole('heading', { name });

  await expect(heading).toBeVisible();
}

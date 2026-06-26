import { test as base } from '@playwright/test';
import { resetDemoState, seedDemoState } from './helpers/demoState.js';

type DemoStateHelpers = {
  reset: () => Promise<void>;
  seed: () => Promise<void>;
  resetAndSeed: () => Promise<void>;
};

export const test = base.extend<{ demoState: DemoStateHelpers }>({
  demoState: async ({ request }, applyDemoState) => {
    await applyDemoState({
      reset: async () => resetDemoState(request),
      seed: async () => seedDemoState(request),
      resetAndSeed: async () => {
        await resetDemoState(request);
        await seedDemoState(request);
      },
    });
  },
});

export { expect } from '@playwright/test';

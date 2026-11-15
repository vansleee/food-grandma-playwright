import { expect, test as base } from '@playwright/test';

const apiURL = process.env.API_BASE_URL ?? 'http://localhost:8081';
const headers = { 'X-Demo-Reset-Key': process.env.DEMO_RESET_KEY ?? 'local-dev-reset-key' };

export const test = base.extend<{ demo: { restaurant_login: { username: string; password: string }; seeded_order_id: number } }>({
  demo: async ({ request }, use) => {
    const reset = await request.post(`${apiURL}/api/test/reset`, { headers });
    await expect(reset).toBeOK();
    const seed = await request.post(`${apiURL}/api/test/seed`, { headers });
    await expect(seed).toBeOK();
    await use(await seed.json());
  },
});

export { apiURL, expect };

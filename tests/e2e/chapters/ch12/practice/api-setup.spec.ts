import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:8081' });

test('第 12 章：確認 API 啟動並建立練習資料', async ({ request }) => {
  for (const path of ['/docs', '/redoc', '/openapi.json']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }

  const headers = { 'X-Demo-Reset-Key': process.env.DEMO_RESET_KEY ?? 'local-dev-reset-key' };
  const reset = await request.post('/api/test/reset', { headers });
  expect(reset.status()).toBe(200);

  const seed = await request.post('/api/test/seed', { headers });
  expect(seed.status()).toBe(200);
  expect(await seed.json()).toMatchObject({
    status: 'seeded',
    seeded_order_id: expect.any(Number),
    seeded_order_status: 'COOKING',
  });
});

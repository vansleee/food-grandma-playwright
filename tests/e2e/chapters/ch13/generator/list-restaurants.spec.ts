// spec: ch13/generator/plan.md
// seed: ch13/generator/seed.spec.ts
import { apiURL, expect, test } from './demo-fixture';

test.describe('Food Grandma API 對照', () => {
  test('list restaurants', async ({ request, demo }) => {
    // 1. GET /api/customer/restaurants/ 應回 HTTP 200，restaurants 至少有一筆帶名稱的餐廳
    const response = await request.get(`${apiURL}/api/customer/restaurants/`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.restaurants.length).toBeGreaterThan(0);
    expect(body.restaurants[0].name).toBeTruthy();
  });
});

// spec: ch13/generator/plan.md
// seed: ch13/generator/seed.spec.ts
import { apiURL, expect, test } from './demo-fixture';

test.describe('Food Grandma API 對照', () => {
  test('latest order without token', async ({ request, demo }) => {
    // 2. GET /api/customer/orders/latest 不附 access_token 應回 HTTP 401，JSON 為 status: failed、error: access_token is required
    const response = await request.get(`${apiURL}/api/customer/orders/latest`);
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({
      status: 'failed',
      error: 'access_token is required',
    });
  });
});

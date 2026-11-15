import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://127.0.0.1:8081';
const DEMO_RESET_KEY = process.env.DEMO_RESET_KEY ?? 'local-dev-reset-key';

type Order = {
  id: number;
  status: string;
  total: number;
  address: string;
  restaurant: { id: number };
  customer: unknown;
  order_details: unknown[];
};

async function resetAndSeed(request: APIRequestContext) {
  const headers = { 'X-Demo-Reset-Key': DEMO_RESET_KEY };
  const reset = await request.post(`${API_BASE_URL}/api/test/reset`, { headers });
  expect(reset.status(), 'reset HTTP status').toBe(200);
  expect((await reset.json()).status).toBe('reset');

  const seed = await request.post(`${API_BASE_URL}/api/test/seed`, { headers });
  expect(seed.status(), 'seed HTTP status').toBe(200);
  const body = await seed.json();
  expect(body.status).toBe('seeded');
  return body.restaurant_login as { username: string; password: string };
}

async function restaurantToken(request: APIRequestContext, login: { username: string; password: string }) {
  const resp = await request.post(`${API_BASE_URL}/api/social/token/`, { form: login });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.access_token, 'restaurant access token').toBeTruthy();
  return body.access_token as string;
}

async function listOrders(request: APIRequestContext, token: string): Promise<Order[]> {
  const resp = await request.get(`${API_BASE_URL}/api/restaurant/orders/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.status, 'order list must not report failure').not.toBe('failed');
  expect(Array.isArray(body.orders)).toBe(true);
  return body.orders;
}

test.describe('03 order mark ready — API', () => {
  test('READY-T01 [READY-01] own Cooking order becomes Ready and stays Ready on re-query', async ({ request }) => {
    const login = await resetAndSeed(request);
    const token = await restaurantToken(request, login);

    // Discover a Cooking order owned by this restaurant instead of assuming seed IDs.
    const before = await listOrders(request, token);
    const target = before.find(o => o.status === 'Cooking');
    expect(target, 'own Cooking order exists after seed').toBeDefined();
    const original = target!;
    const ownRestaurantId = original.restaurant.id;
    expect(before.every(o => o.restaurant.id === ownRestaurantId), 'list only contains own orders').toBe(true);

    const resp = await request.patch(`${API_BASE_URL}/api/restaurant/orders/${original.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // HTTP 200 alone does not mean success: failures also return 200 with status:"failed".
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.status, 'update must not report failure').not.toBe('failed');
    expect(body.error).toBeUndefined();
    expect(body.order, 'response carries updated order').toBeDefined();

    const updated: Order = body.order;
    expect(updated.id).toBe(original.id);
    expect(updated.status).toBe('Ready');
    expect(updated.restaurant.id).toBe(ownRestaurantId);
    // Only the status changes; order content is preserved.
    expect(updated.total).toBe(original.total);
    expect(updated.address).toBe(original.address);
    expect(updated.customer).toEqual(original.customer);
    expect(updated.order_details).toEqual(original.order_details);

    const after = await listOrders(request, token);
    const persisted = after.find(o => o.id === original.id);
    expect(persisted, 'order still listed for own restaurant').toBeDefined();
    expect(persisted!.status).toBe('Ready');
    expect(persisted!.order_details).toEqual(original.order_details);

    // No other order was touched by this update.
    const othersBefore = before.filter(o => o.id !== original.id).map(o => [o.id, o.status]);
    const othersAfter = after.filter(o => o.id !== original.id).map(o => [o.id, o.status]);
    expect(othersAfter).toEqual(othersBefore);
  });
});

import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:8081' });

const resetKey = process.env.DEMO_RESET_KEY ?? 'local-dev-reset-key';

test.beforeEach(async ({ request }) => {
  const headers = { 'X-Demo-Reset-Key': resetKey };
  const reset = await request.post('/api/test/reset', { headers });
  expect(reset.ok()).toBeTruthy();

  const seed = await request.post('/api/test/seed', { headers });
  expect(seed.ok()).toBeTruthy();
});

test('customer can list restaurants', async ({ request }) => {
  // Arrange: seed data 已由 beforeEach 建立

  // Act
  const response = await request.get('/api/customer/restaurants/');
  const body = await response.json();

  // Assert
  expect(response.ok()).toBeTruthy();
  expect(body.restaurants).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: expect.any(String) }),
    ]),
  );
});

test('latest order requires a customer token', async ({ request }) => {
  // Arrange
  const expectedError = 'access_token is required';

  // Act
  const response = await request.get('/api/customer/orders/latest');
  const body = await response.json();

  // Assert
  expect(response.status()).toBe(401);
  expect(body).toMatchObject({
    status: 'failed',
    error: expectedError,
  });
});

test('customer cannot create a second active order', async ({ request }) => {
  // Arrange
  const customerToken = 'e2e-customer-token';
  const latest = await request.get('/api/customer/orders/latest', {
    params: { access_token: customerToken },
  });
  expect(latest.ok()).toBeTruthy();
  const { last_order: order } = await latest.json();
  expect(order.status).toBe('Cooking');
  const orderDetails = JSON.stringify([
    { meal_id: order.order_details[0].meal.id, quantity: 1 },
  ]);

  // Act
  const response = await request.post('/api/customer/orders/', {
    form: {
      access_token: customerToken,
      restaurant_id: String(order.restaurant.id),
      address: 'Taipei Main Station',
      order_details: orderDetails,
    },
  });
  const body = await response.json();

  // Assert
  expect(response.ok()).toBeTruthy();
  expect(body).toEqual({
    status: 'failed',
    error: 'Your last order must be completed.',
  });
});

test('customer token cannot call driver API', async ({ request }) => {
  // Arrange：使用 customer token 呼叫 driver 專用端點
  const response = await request.get('/api/driver/me/', {
    params: { access_token: 'e2e-customer-token' },
  });
  const body = await response.json();

  // Assert
  expect(response.status()).toBe(401);
  expect(body).toMatchObject({
    status: 'failed',
    error: 'token does not belong to a driver',
  });
});

test('driver cannot pick an already-picked order', async ({ request }) => {
  // Arrange：從待取餐清單選一筆訂單，並成功接單。
  const ready = await request.get('/api/driver/orders/', { params: { status: 'ready' } });
  expect(ready.ok()).toBeTruthy();
  const { orders } = await ready.json();
  expect(orders.length).toBeGreaterThan(0);
  const claimPath = `/api/driver/orders/${orders[0].id}/claim`;
  const form = { access_token: 'e2e-driver-token' };
  const first = await request.post(claimPath, { form });
  expect(first.ok()).toBeTruthy();
  expect(await first.json()).toEqual({ status: 'success' });

  // Act：再接取同一筆訂單。
  const response = await request.post(claimPath, { form });
  const body = await response.json();

  // Assert
  expect(response.ok()).toBeTruthy();
  expect(body).toEqual({
    status: 'failed',
    error: expect.any(String),
  });
});

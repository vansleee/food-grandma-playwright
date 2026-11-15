import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:8081' });
test.describe.configure({ mode: 'serial' });

const resetHeaders = {
  'X-Demo-Reset-Key': process.env.DEMO_RESET_KEY ?? 'local-dev-reset-key',
};

type SeedResponse = {
  status: string;
  customer_access_token: string;
  seeded_order_id: number;
};

let seedData: SeedResponse;

test.beforeEach(async ({ request }) => {
  const resetResponse = await request.post('/api/test/reset', {
    headers: resetHeaders,
  });
  expect(resetResponse.status()).toBe(200);
  expect(await resetResponse.json()).toEqual({ status: 'reset' });

  const seedResponse = await request.post('/api/test/seed', {
    headers: resetHeaders,
  });
  expect(seedResponse.status()).toBe(200);

  const body = await seedResponse.json();
  expect(body.status).toBe('seeded');
  expect(body.customer_access_token).toBeTruthy();
  expect(body.seeded_order_id).toEqual(expect.any(Number));
  seedData = body as SeedResponse;
});

test('customer can retrieve the restaurant list', async ({ request }) => {
  // Arrange: test data is reset and seeded in beforeEach.

  // Act
  const response = await request.get('/api/customer/restaurants/');

  // Assert
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.restaurants).toEqual(expect.any(Array));
  expect(body.restaurants.length).toBeGreaterThan(0);
  expect(body.restaurants[0]).toEqual(
    expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      phone: expect.any(String),
      address: expect.any(String),
      logo: expect.any(String),
    }),
  );
});

test('latest order cannot be queried without a token', async ({ request }) => {
  // Arrange: test data is reset and seeded in beforeEach.

  // Act
  const response = await request.get('/api/customer/orders/latest');

  // Assert
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({
    detail: 'access_token is required',
  });
});

test('customer cannot create a second unfinished order', async ({ request }) => {
  // Arrange
  const latestOrderResponse = await request.get(
    `/api/customer/orders/latest?access_token=${encodeURIComponent(seedData.customer_access_token)}`,
  );
  expect(latestOrderResponse.status()).toBe(200);

  const latestOrderBody = await latestOrderResponse.json();
  expect(latestOrderBody.last_order).not.toBeNull();
  expect(latestOrderBody.last_order.id).toEqual(expect.any(Number));

  const restaurantsResponse = await request.get('/api/customer/restaurants/');
  expect(restaurantsResponse.status()).toBe(200);
  const restaurantsBody = await restaurantsResponse.json();
  const restaurant = restaurantsBody.restaurants[0];
  expect(restaurant).toBeTruthy();

  const mealsResponse = await request.get(
    `/api/customer/meals/${restaurant.id}`,
  );
  expect(mealsResponse.status()).toBe(200);
  const mealsBody = await mealsResponse.json();
  const meal = mealsBody.meals[0];
  expect(meal).toBeTruthy();

  // Act
  const response = await request.post('/api/customer/orders/', {
    form: {
      access_token: seedData.customer_access_token,
      restaurant_id: String(restaurant.id),
      address: 'Test address',
      order_details: JSON.stringify([{ meal_id: meal.id, quantity: 1 }]),
    },
  });

  // Assert
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    status: 'failed',
    error: 'Your last order must be completed.',
  });
});

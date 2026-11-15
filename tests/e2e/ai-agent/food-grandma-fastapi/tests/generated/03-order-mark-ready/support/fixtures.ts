import { test as base, expect, type APIRequestContext } from "@playwright/test";
import { RestaurantOrders } from "./restaurant-orders";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8081";
const DEMO_RESET_KEY = process.env.DEMO_RESET_KEY ?? "local-dev-reset-key";

type Login = { username: string; password: string };

async function resetAndSeed(api: APIRequestContext): Promise<Login> {
  const headers = { "X-Demo-Reset-Key": DEMO_RESET_KEY };
  const reset = await api.post("/api/test/reset", { headers });
  expect(reset.status()).toBe(200);
  expect((await reset.json()).status).toBe("reset");
  const seed = await api.post("/api/test/seed", { headers });
  expect(seed.status()).toBe(200);
  const seeded = await seed.json();
  expect(seeded.status).toBe("seeded");
  // Use the login the seed reports instead of a hard-coded account.
  return seeded.restaurant_login;
}

async function signIn(api: APIRequestContext, login: Login): Promise<string> {
  const resp = await api.post("/api/social/token/", { form: login });
  expect(resp.status()).toBe(200);
  const token = (await resp.json()).access_token;
  expect(token).toBeTruthy();
  return token;
}

type Fixtures = {
  // Test-scoped: every test gets a freshly reset + seeded backend and the
  // seeded restaurant's orders. Mark-ready mutates orders, so never share it.
  seededRestaurantOrders: RestaurantOrders;
};

export const test = base.extend<Fixtures>({
  seededRestaurantOrders: async ({ playwright }, use) => {
    const anonymous = await playwright.request.newContext({ baseURL: API_BASE_URL });
    const token = await signIn(anonymous, await resetAndSeed(anonymous));
    const restaurant = await playwright.request.newContext({
      baseURL: API_BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });
    await use(new RestaurantOrders(restaurant));
    await restaurant.dispose();
    await anonymous.dispose();
  },
});

export { expect };

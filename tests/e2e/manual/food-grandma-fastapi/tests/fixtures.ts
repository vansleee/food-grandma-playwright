import { test as base, expect, APIRequestContext, Page } from "@playwright/test";

export const API_BASE_URL = "http://localhost:8081";
export const RESTAURANT_USERNAME = "admin";
export const RESTAURANT_PASSWORD = "password@321";
const TOKEN_STORAGE_KEY = "food_grandma_restaurant_token";
// Must match the backend's DEMO_RESET_KEY; services.sh and docker-compose.yml
// default to the same local-only value.
const DEMO_RESET_KEY = process.env.DEMO_RESET_KEY ?? "local-dev-reset-key";

export async function resetAndSeed(request: APIRequestContext) {
  const headers = { "X-Demo-Reset-Key": DEMO_RESET_KEY };
  // Fail loudly — a silently rejected reset leaves tests on stale data.
  for (const path of ["/api/test/reset", "/api/test/seed"]) {
    const resp = await request.post(`${API_BASE_URL}${path}`, { headers });
    expect(resp.ok(), `${path} returned ${resp.status()}`).toBeTruthy();
  }
}

export async function loginViaApi(
  request: APIRequestContext,
  username: string,
  password: string
): Promise<string> {
  const resp = await request.post(`${API_BASE_URL}/api/social/token/`, {
    form: { username, password },
  });
  const body = await resp.json();
  return body.access_token as string;
}

export async function injectToken(page: Page, token: string) {
  // A one-time localStorage write after landing on the app's origin, not
  // `addInitScript` — that reruns on every navigation in the page's
  // lifetime, which would silently re-authenticate a test after it signs
  // out and re-navigates, masking a real "session cleared" regression.
  await page.goto("/management/sign-in");
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: TOKEN_STORAGE_KEY, value: token }
  );
}

type Fixtures = {
  // Signed-in page for the seeded admin/Pizza Palace restaurant. Resets +
  // seeds demo data and injects the auth token directly into localStorage
  // instead of driving the sign-in form, so specs that aren't testing the
  // sign-in flow itself don't pay for a redundant UI login every test.
  authedPage: Page;
};

export const test = base.extend<Fixtures>({
  authedPage: async ({ page, request }, use) => {
    await resetAndSeed(request);
    const token = await loginViaApi(request, RESTAURANT_USERNAME, RESTAURANT_PASSWORD);
    await injectToken(page, token);
    await use(page);
  },
});

export { expect };

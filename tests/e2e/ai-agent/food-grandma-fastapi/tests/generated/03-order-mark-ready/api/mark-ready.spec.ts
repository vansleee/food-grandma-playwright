import { test, expect, APIRequestContext } from "@playwright/test";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8081";
const DEMO_RESET_KEY = process.env.DEMO_RESET_KEY ?? "local-dev-reset-key";

type Order = {
  id: number;
  customer: { id: number; name: string; avatar: string; address: string };
  restaurant: { id: number; name: string; phone: string; address: string };
  driver: unknown;
  order_details: { id: number; meal: { id: number; name: string; price: number }; quantity: number; sub_total: number }[];
  total: number;
  status: string;
  address: string;
};

let token: string;

async function listOrders(request: APIRequestContext): Promise<Order[]> {
  const resp = await request.get(`${API_BASE_URL}/api/restaurant/orders/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.status).toBeUndefined();
  expect(Array.isArray(body.orders)).toBeTruthy();
  return body.orders;
}

test.beforeEach(async ({ request }) => {
  const headers = { "X-Demo-Reset-Key": DEMO_RESET_KEY };
  const reset = await request.post(`${API_BASE_URL}/api/test/reset`, { headers });
  expect(reset.status()).toBe(200);
  expect((await reset.json()).status).toBe("reset");
  const seed = await request.post(`${API_BASE_URL}/api/test/seed`, { headers });
  expect(seed.status()).toBe(200);
  const seeded = await seed.json();
  expect(seeded.status).toBe("seeded");

  // Use the login the seed reports instead of a hard-coded account.
  const login = await request.post(`${API_BASE_URL}/api/social/token/`, { form: seeded.restaurant_login });
  expect(login.status()).toBe(200);
  token = (await login.json()).access_token;
  expect(token).toBeTruthy();
});

test.describe("Mark order ready API", () => {
  test("READY-T01 [READY-01] own Cooking order is updated to Ready", async ({ request }) => {
    // Arrange — discover an own Cooking order rather than assuming seed IDs.
    const before = await listOrders(request);
    const original = before.find((o) => o.status === "Cooking");
    expect(original, "seed must provide an own Cooking order").toBeDefined();

    // Act — PATCH takes no JSON body.
    const resp = await request.patch(`${API_BASE_URL}/api/restaurant/orders/${original!.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Assert — HTTP 200 alone is not success: "not found" is also 200 with status:"failed".
    expect(resp.status()).toBe(200);
    expect(resp.headers()["content-type"]).toContain("application/json");
    const body = await resp.json();
    expect(Object.keys(body)).toEqual(["order"]);
    const updated: Order = body.order;
    expect(Object.keys(updated).sort()).toEqual(
      ["address", "customer", "driver", "id", "order_details", "restaurant", "status", "total"]
    );
    expect(updated.id).toBe(original!.id);
    expect(updated.status).toBe("Ready");
    // Only the status changes; the rest of the order is returned as it was.
    expect({ ...updated, status: original!.status }).toEqual(original);

    // Assert — re-query shows the persisted state; no other order was touched.
    const after = await listOrders(request);
    expect(after.find((o) => o.id === original!.id)).toEqual(updated);
    expect(after.filter((o) => o.id !== original!.id)).toEqual(before.filter((o) => o.id !== original!.id));
  });
});

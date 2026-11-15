import { expect, type APIResponse } from "@playwright/test";
import { ORDER_FIELDS, type Order, type OrderStatus } from "./restaurant-orders";

// Contract C1/C2: success is HTTP 200 with exactly `{ order }`. A bare 200
// is not enough — "not found" is also 200, with `{ status: "failed" }`.
export async function expectOrderPayload(response: APIResponse): Promise<Order> {
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");
  const body = await response.json();
  expect(Object.keys(body)).toEqual(["order"]);
  expect(Object.keys(body.order).sort()).toEqual(ORDER_FIELDS);
  return body.order;
}

// Contract C3/C4: the status moved to `expected`; everything else, ID included, is as before.
export function expectOnlyStatusChanged(before: Order, after: Order, expected: OrderStatus) {
  expect(after.status).toBe(expected);
  expect({ ...after, status: before.status }).toEqual(before);
}

// Contract C7: a re-query shows every order exactly as before the update.
export function expectNoOrderChanged(before: Order[], after: Order[]) {
  expect(after).toEqual(before);
}

// Contract C5: a re-query shows `changed` as returned, and no other order moved.
export function expectOnlyOrderChanged(before: Order[], after: Order[], changed: Order) {
  expect(after.find((o) => o.id === changed.id)).toEqual(changed);
  expect(after.filter((o) => o.id !== changed.id)).toEqual(before.filter((o) => o.id !== changed.id));
}

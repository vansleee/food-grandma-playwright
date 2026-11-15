import { test, expect } from "../support/fixtures";
import { requireOrderWithStatus, type OrderStatus } from "../support/restaurant-orders";
import { expectOrderPayload } from "../support/order-assertions";

// READY-05 documents current behaviour: no "illegal transition" error, the
// order comes back as it was. "Ready" also covers repeating mark-ready.
const NON_COOKING: OrderStatus[] = ["Ready", "On the way", "Delivered"];

test.describe("Mark order ready API — non-Cooking orders", () => {
  for (const status of NON_COOKING) {
    test(`READY-T04 [READY-05] own ${status} order is returned unchanged`, async ({ seededRestaurantOrders: orders }) => {
      // Arrange
      const before = await orders.list();
      const order = requireOrderWithStatus(before, status);

      // Act
      const response = await orders.markReady(order.id);

      // Assert — response
      expect(await expectOrderPayload(response)).toEqual(order);

      // Assert — persisted
      expect(await orders.list()).toEqual(before);
    });
  }
});

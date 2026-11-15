import { test } from "../support/fixtures";
import { requireOrderWithStatus } from "../support/restaurant-orders";
import { expectOnlyOrderChanged, expectOnlyStatusChanged, expectOrderPayload } from "../support/order-assertions";

test.describe("Mark order ready API", () => {
  test("READY-T01 [READY-01] own Cooking order is updated to Ready", async ({ seededRestaurantOrders: orders }) => {
    // Arrange
    const before = await orders.list();
    const cooking = requireOrderWithStatus(before, "Cooking");

    // Act
    const response = await orders.markReady(cooking.id);

    // Assert — response
    const updated = await expectOrderPayload(response);
    expectOnlyStatusChanged(cooking, updated, "Ready");

    // Assert — persisted
    expectOnlyOrderChanged(before, await orders.list(), updated);
  });
});

import { expect, type APIRequestContext, type APIResponse } from "@playwright/test";

export type OrderStatus = "Cooking" | "Ready" | "On the way" | "Delivered";

// Shape of serialize_order() in food-grandma-fastapi/app/serializers.py.
// OpenAPI declares the 200 schema as `{}`, so this is the contract source.
export type Order = {
  id: number;
  customer: { id: number; name: string; avatar: string; address: string };
  restaurant: { id: number; name: string; phone: string; address: string };
  driver: { id: number; name: string; avatar: string; car_model: string; plate_number: string } | null;
  order_details: { id: number; meal: { id: number; name: string; price: number }; quantity: number; sub_total: number }[];
  total: number;
  status: OrderStatus;
  address: string;
};

export const ORDER_FIELDS = ["address", "customer", "driver", "id", "order_details", "restaurant", "status", "total"];

// Repository over the signed-in restaurant's orders. The context it wraps
// already carries the restaurant's Bearer token, so callers never handle auth.
export class RestaurantOrders {
  constructor(private readonly api: APIRequestContext) {}

  async list(): Promise<Order[]> {
    const resp = await this.api.get("/api/restaurant/orders/");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Object.keys(body)).toEqual(["orders"]);
    return body.orders;
  }

  // Returns the raw response: the status code and envelope are what the test asserts.
  markReady(orderId: number): Promise<APIResponse> {
    return this.api.patch(`/api/restaurant/orders/${orderId}`);
  }
}

// Picks an own order in the given state from the seed instead of assuming its ID.
export function requireOrderWithStatus(orders: Order[], status: OrderStatus): Order {
  const order = orders.find((o) => o.status === status);
  expect(order, `seed must provide an own ${status} order`).toBeDefined();
  return order!;
}

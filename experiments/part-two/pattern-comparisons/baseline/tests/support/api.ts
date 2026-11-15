import { APIRequestContext, expect } from '@playwright/test';
import { testPassword } from './env';

export interface OrderView {
  id: number;
  customer: { id: number; name: string };
  driver: { id: number; name: string } | null;
  status: string;
  address: string;
  total: number;
}

export interface MealView {
  id: number;
  name: string;
  short_description: string;
  image: string;
  price: number;
}

export interface AccountView {
  restaurant: { id: number; name: string; phone: string; address: string; logo: string };
  user: { username: string; first_name: string; last_name: string; email: string };
}

export interface MealInput {
  name: string;
  short_description?: string;
  image?: string;
  price?: number;
}

/** Thin wrapper over the real backend; used only for data preparation and read-back. */
export class Api {
  private tokens = new Map<string, string>();

  constructor(private readonly ctx: APIRequestContext) {}

  async login(username: string): Promise<string> {
    const cached = this.tokens.get(username);
    if (cached) return cached;
    const res = await this.ctx.post('/api/social/token/', {
      form: { username, password: testPassword() },
    });
    expect(res.ok(), `login for ${username} should succeed (HTTP ${res.status()})`).toBeTruthy();
    const token = (await res.json()).access_token as string;
    expect(token).toBeTruthy();
    this.tokens.set(username, token);
    return token;
  }

  private bearer(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  // ---- restaurant ----
  async restaurantMe(token: string): Promise<AccountView> {
    const res = await this.ctx.get('/api/restaurant/me/', { headers: this.bearer(token) });
    expect(res.ok()).toBeTruthy();
    return res.json();
  }

  async listMeals(token: string): Promise<MealView[]> {
    const res = await this.ctx.get('/api/restaurant/meals/', { headers: this.bearer(token) });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).meals;
  }

  async createMeal(token: string, input: MealInput): Promise<MealView> {
    const res = await this.ctx.post('/api/restaurant/meals/', {
      headers: this.bearer(token),
      data: { short_description: '', image: '', price: 0, ...input },
    });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).meal;
  }

  async listOrders(token: string): Promise<OrderView[]> {
    const res = await this.ctx.get('/api/restaurant/orders/', { headers: this.bearer(token) });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).orders;
  }

  async markReady(token: string, orderId: number): Promise<void> {
    const res = await this.ctx.patch(`/api/restaurant/orders/${orderId}`, { headers: this.bearer(token) });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.order?.status, `order ${orderId} should become Ready`).toBe('Ready');
  }

  // ---- customer ----
  async placeOrder(
    customerToken: string,
    restaurantId: number,
    address: string,
    items: { meal_id: number; quantity: number }[],
  ): Promise<void> {
    const res = await this.ctx.post('/api/customer/orders/', {
      form: {
        access_token: customerToken,
        restaurant_id: String(restaurantId),
        address,
        order_details: JSON.stringify(items),
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status, `place order failed: ${body.error ?? ''}`).toBe('success');
  }

  // ---- driver ----
  async driverProfile(token: string): Promise<{ id: number; name: string }> {
    const res = await this.ctx.get('/api/driver/me/', { params: { access_token: token } });
    expect(res.ok()).toBeTruthy();
    return (await res.json()).driver;
  }

  async claim(driverToken: string, orderId: number): Promise<void> {
    const res = await this.ctx.post(`/api/driver/orders/${orderId}/claim`, {
      form: { access_token: driverToken },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status, `claim failed: ${body.error ?? ''}`).toBe('success');
  }
}

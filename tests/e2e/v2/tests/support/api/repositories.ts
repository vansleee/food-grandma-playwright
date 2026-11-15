import { expect } from '@playwright/test';
import type {
  ApiMeal,
  ApiOrder,
  MealDraft,
  ProfilePayload,
  RestaurantProfile,
} from '../domain';
import { readJson, type RoleApiClient } from './role-client';

/**
 * Ch32 Repository：只放測試需要的查詢與準備動作，並隱藏 URL／HTTP 細節。
 * 這裡一律連真實後端；沒有 in-memory fake，因為本輪要驗收的就是真實整合。
 */
export class RestaurantRepository {
  constructor(private readonly client: RoleApiClient) {}

  async profile(): Promise<RestaurantProfile> {
    return readJson(await this.client.get('/api/restaurant/me/'), '讀取餐廳資料');
  }

  async updateProfile(payload: ProfilePayload): Promise<RestaurantProfile> {
    return readJson(await this.client.json('PUT', '/api/restaurant/me/', payload), '更新餐廳資料');
  }

  async listMeals(): Promise<ApiMeal[]> {
    const body = await readJson<{ meals: ApiMeal[] }>(
      await this.client.get('/api/restaurant/meals/'),
      '查詢餐點列表',
    );
    return body.meals;
  }

  async createMeal(draft: MealDraft): Promise<ApiMeal> {
    const body = await readJson<{ meal: ApiMeal }>(
      await this.client.json('POST', '/api/restaurant/meals/', draft),
      '新增餐點',
    );
    return body.meal;
  }

  async getMeal(id: number): Promise<ApiMeal> {
    const body = await readJson<{ meal: ApiMeal }>(
      await this.client.get(`/api/restaurant/meals/${id}`),
      `查詢餐點 ${id}`,
    );
    return body.meal;
  }

  async listOrders(): Promise<ApiOrder[]> {
    const body = await readJson<{ orders: ApiOrder[] }>(
      await this.client.get('/api/restaurant/orders/'),
      '查詢訂單列表',
    );
    return body.orders;
  }

  async getOrder(id: number): Promise<ApiOrder> {
    const order = (await this.listOrders()).find((candidate) => candidate.id === id);
    expect(order, `餐廳訂單列表找不到訂單 ${id}`).toBeDefined();
    return order!;
  }

  /** 標記備餐完成；成功與否以回傳的訂單狀態確認，而不是只看 HTTP 200。 */
  async markReady(id: number): Promise<ApiOrder> {
    const body = await readJson<{ order: ApiOrder }>(
      await this.client.json('PATCH', `/api/restaurant/orders/${id}`),
      `標記訂單 ${id} 備餐完成`,
    );
    expect(body.order.status).toBe('Ready');
    return body.order;
  }
}

export class CustomerRepository {
  constructor(private readonly client: RoleApiClient) {}

  async placeOrder(restaurantId: number, address: string, mealId: number, quantity: number) {
    await readJson(
      await this.client.form('POST', '/api/customer/orders/', {
        restaurant_id: String(restaurantId),
        address,
        order_details: JSON.stringify([{ meal_id: mealId, quantity }]),
      }),
      '顧客下單',
    );
  }
}

export class DriverRepository {
  constructor(private readonly client: RoleApiClient) {}

  async profile(): Promise<{ id: number; name: string }> {
    const body = await readJson<{ driver: { id: number; name: string } }>(
      await this.client.get('/api/driver/me/'),
      '讀取外送員資料',
    );
    return body.driver;
  }

  /** 準備資料用：預期接單成功。要驗證被拒絕的接單必須走 UI。 */
  async claim(orderId: number) {
    await readJson(
      await this.client.form('POST', `/api/driver/orders/${orderId}/claim`),
      `外送員接取訂單 ${orderId}`,
    );
  }

  async complete(orderId: number) {
    await readJson(
      await this.client.form('PATCH', `/api/driver/orders/${orderId}`),
      `外送員完成訂單 ${orderId}`,
    );
  }
}

import { expect } from '@playwright/test';
import type { RestaurantRepository } from './api/repositories';
import type { Stage } from './api/stage';
import { MealBuilder } from './builders';
import type { ApiMeal, ApiOrder, OrderStatus } from './domain';

type CustomerKey = 'customerA' | 'customerB';

/**
 * Ch30 Object Mother：把 READY／FIND／ROLE／AUTH 反覆需要的「訂單情境」命名。
 * 沒有任意設定狀態的 API，所以每個情境都走合法流程：
 * 顧客下單(Cooking) → 店家備餐完成(Ready) → 外送員接單(On the way) → 完成配送(Delivered)。
 * 顧客有未完成訂單就不能再下單，因此同一顧客的下一筆要等前一筆 Delivered。
 */
export class OrderMother {
  private constructor(
    private readonly stage: Stage,
    readonly restaurant: RestaurantRepository,
    readonly restaurantId: number,
    readonly meal: ApiMeal,
  ) {}

  /** 開設餐廳 A 的菜單（每家餐廳起始沒有餐點）。 */
  static async open(stage: Stage, label: string): Promise<OrderMother> {
    const restaurant = await stage.restaurant('restaurantA');
    const { restaurant: profile } = await restaurant.profile();
    const meal = await restaurant.createMeal(new MealBuilder(label).build());
    return new OrderMother(stage, restaurant, profile.id, meal);
  }

  async cooking(customer: CustomerKey, address: string): Promise<ApiOrder> {
    const before = new Set((await this.restaurant.listOrders()).map((order) => order.id));
    await (await this.stage.customer(customer)).placeOrder(this.restaurantId, address, this.meal.id, 1);
    const created = (await this.restaurant.listOrders()).filter((order) => !before.has(order.id));
    expect(created, `${customer} 下單後應只新增一筆訂單`).toHaveLength(1);
    expect(created[0].status).toBe('Cooking');
    return created[0];
  }

  async ready(customer: CustomerKey, address: string): Promise<ApiOrder> {
    const order = await this.cooking(customer, address);
    return this.restaurant.markReady(order.id);
  }

  async onTheWay(customer: CustomerKey, address: string, driver: 'driverA' | 'driverB'): Promise<ApiOrder> {
    const order = await this.ready(customer, address);
    await (await this.stage.driver(driver)).claim(order.id);
    return this.expectStatus(order.id, 'On the way');
  }

  async delivered(customer: CustomerKey, address: string, driver: 'driverA' | 'driverB'): Promise<ApiOrder> {
    const order = await this.onTheWay(customer, address, driver);
    await (await this.stage.driver(driver)).complete(order.id);
    return this.expectStatus(order.id, 'Delivered');
  }

  async expectStatus(orderId: number, status: OrderStatus): Promise<ApiOrder> {
    const order = await this.restaurant.getOrder(orderId);
    expect(order.status).toBe(status);
    return order;
  }
}

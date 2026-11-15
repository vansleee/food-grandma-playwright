import type { Page } from '@playwright/test';
import type { Api, OrderView } from '../support/api';
import { DriverOrdersPage } from '../support/pages';
import { test as base } from '../support/test';
import { CustomerOrderingWorkflow, type OrderInput } from './customerworkflows';
import { readOrder } from './order-checks';
import { DriverDeliveryPage, RestaurantOrdersPage } from './page';

// 簡化 Screenplay：自行實作教學介面，沒有安裝或冒充 Serenity/JS API。
export class BrowseTheWeb {
  constructor(readonly page: Page) {}
}
export class ReadRestaurantOrders {
  constructor(private readonly api: Api, private readonly token: string) {}
  at(address: string) { return readOrder(this.api, this.token, address); }
}
type Task = { name: string; performAs(actor: Actor): Promise<void> };
type Question<T> = (actor: Actor) => Promise<T>;
export class Actor {
  constructor(readonly name: string, readonly web: BrowseTheWeb, readonly orders?: ReadRestaurantOrders) {}
  async attemptsTo(...tasks: Task[]) {
    for (const task of tasks) await base.step(`${this.name}：${task.name}`, () => task.performAs(this));
  }
  asks<T>(question: Question<T>) { return question(this); }
}
export const PlaceOrder = (order: OrderInput): Task => ({
  name: `訂餐並配送至 ${order.address}`,
  async performAs(actor) {
    await actor.web.page.goto('/customer/restaurants');
    await new CustomerOrderingWorkflow(actor.web.page).placeOrder(order);
  },
});
export const MarkOrderReady = (id: number): Task => ({
  name: `將訂單 #${id} 標記為待取餐`,
  async performAs(actor) { await new RestaurantOrdersPage(actor.web.page).markReady(id); },
});
export const ClaimOrder = (id: number): Task => ({
  name: `接取訂單 #${id}`,
  async performAs(actor) {
    await new DriverOrdersPage(actor.web.page).claim(id);
    await new DriverDeliveryPage(actor.web.page).expectActiveOrder(id);
  },
});
export const ConfirmDelivered = (id: number): Task => ({
  name: `確認訂單 #${id} 已送達`,
  async performAs(actor) { await new DriverDeliveryPage(actor.web.page).confirmDelivered(id); },
});
export const TheOrder = (address: string): Question<OrderView> => async (actor) => {
  if (!actor.orders) throw new Error(`${actor.name} 沒有查詢餐廳訂單的能力`);
  return actor.orders.at(address);
};

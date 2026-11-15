import type { MealView } from '../support/api';
import type { Restaurant } from '../support/base-fixtures';
import { openManagementAs, OrdersPage } from '../support/pages';
import { expect, test, World } from '../support/test';

test.describe('未使用情境工廠', () => {
  test('CH30-T01 搜尋與待取餐篩選同時生效', async ({ page, api, caseId }, info) => {
    // Arrange：準備備餐中與待取餐訂單，確認搜尋可找到兩筆。
    const world = new World(api, caseId);
    const restaurant = await world.restaurant();
    const meal = await world.meal(restaurant, { name: `${caseId} meal`, price: 100 });
    const common = `Common${caseId}`;
    const cooking = await world.order(restaurant, 'customerA', `Harbor Lane ${common}`, meal.id);
    const ready = await world.order(restaurant, 'customerB', `Willow Court ${common}`, meal.id);
    await api.markReady(restaurant.token, ready.id);
    const all = await api.listOrders(restaurant.token);
    expect(all.find((order) => order.id === cooking.id)?.status).toBe('Cooking');
    expect(all.find((order) => order.id === ready.id)?.status).toBe('Ready');
    const orders = new OrdersPage(page);
    await openManagementAs(page, restaurant.token, '/management/orders');
    await orders.waitUntilLoaded();
    await orders.search(common);
    await orders.expectRows([cooking.id, ready.id]);

    // Act：加上待取餐篩選。
    await orders.chooseTab('待取餐');

    // Assert：只顯示同時符合搜尋與待取餐狀態的訂單。
    await orders.expectRows([ready.id]);
    await expect(orders.row(cooking.id)).toHaveCount(0);
    await expect(orders.statusOf(ready.id)).toHaveText('待取餐');

    // Act：改為搜尋備餐中訂單的顧客，保留狀態篩選。
    await orders.search(all.find((order) => order.id === cooking.id)!.customer.name);

    // Assert：該顧客的訂單不符合待取餐條件。
    await orders.expectRows([]);

    // Act：搜尋待取餐訂單的顧客。
    await orders.search(all.find((order) => order.id === ready.id)!.customer.name);

    // Assert：仍只顯示該顧客的待取餐訂單。
    await orders.expectRows([ready.id]);
  });
});

test.describe('v1', () => {
  async function seedTwoOrders(world: World) {
    const restaurant = await world.restaurant();
    const meal = await world.meal(restaurant, { name: `${world.caseId} meal`, price: 100 });
    const common = `Common${world.caseId}`;
    const cooking = await world.order(restaurant, 'customerA', `Harbor Lane ${common}`, meal.id);
    const ready = await world.order(restaurant, 'customerB', `Willow Court ${common}`, meal.id);
    await world.api.markReady(restaurant.token, ready.id);
    return { restaurant, common, cooking, ready };
  }
  test('CH30-T01 搜尋與待取餐篩選同時生效', async ({ page, api, caseId }, info) => {
    // Arrange：準備備餐中與待取餐訂單，確認搜尋可找到兩筆。
    const world = new World(api, caseId);
    const { restaurant, common, cooking, ready } = await seedTwoOrders(world);
    const all = await api.listOrders(restaurant.token);
    expect(all.find((order) => order.id === cooking.id)?.status).toBe('Cooking');
    expect(all.find((order) => order.id === ready.id)?.status).toBe('Ready');
    const orders = new OrdersPage(page);
    await openManagementAs(page, restaurant.token, '/management/orders');
    await orders.waitUntilLoaded();
    await orders.search(common);
    await orders.expectRows([cooking.id, ready.id]);

    // Act：加上待取餐篩選。
    await orders.chooseTab('待取餐');

    // Assert：只顯示同時符合搜尋與待取餐狀態的訂單。
    await orders.expectRows([ready.id]);
    await expect(orders.row(cooking.id)).toHaveCount(0);
    await expect(orders.statusOf(ready.id)).toHaveText('待取餐');

    // Act：改為搜尋備餐中訂單的顧客，保留狀態篩選。
    await orders.search(all.find((order) => order.id === cooking.id)!.customer.name);

    // Assert：該顧客的訂單不符合待取餐條件。
    await orders.expectRows([]);

    // Act：搜尋待取餐訂單的顧客。
    await orders.search(all.find((order) => order.id === ready.id)!.customer.name);

    // Assert：仍只顯示該顧客的待取餐訂單。
    await orders.expectRows([ready.id]);
  });
});

test.describe('v2', () => {
  class OrderMother {
    private constructor(private readonly world: World, readonly restaurant: Restaurant, private readonly meal: MealView) { }

    static async open(world: World) {
      const restaurant = await world.restaurant();
      const meal = await world.meal(restaurant, { name: `${world.caseId} meal`, price: 100 });
      return new OrderMother(world, restaurant, meal);
    }

    cooking(customer: 'customerA' | 'customerB', address: string) {
      return this.world.order(this.restaurant, customer, address, this.meal.id);
    }

    async ready(customer: 'customerA' | 'customerB', address: string) {
      const order = await this.cooking(customer, address);
      await this.world.api.markReady(this.restaurant.token, order.id);
      return this.world.readOrder(this.restaurant, order.id);
    }
  }
  test('CH30-T01 搜尋與待取餐篩選同時生效', async ({ page, api, caseId }, info) => {
    // Arrange：準備備餐中與待取餐訂單，確認搜尋可找到兩筆。
    const world = new World(api, caseId);
    const mother = await OrderMother.open(world);
    const restaurant = mother.restaurant;
    const common = `Common${caseId}`;
    const cooking = await mother.cooking('customerA', `Harbor Lane ${common}`);
    const ready = await mother.ready('customerB', `Willow Court ${common}`);
    const all = await api.listOrders(restaurant.token);
    expect(all.find((order) => order.id === cooking.id)?.status).toBe('Cooking');
    expect(all.find((order) => order.id === ready.id)?.status).toBe('Ready');
    const orders = new OrdersPage(page);
    await openManagementAs(page, restaurant.token, '/management/orders');
    await orders.waitUntilLoaded();
    await orders.search(common);
    await orders.expectRows([cooking.id, ready.id]);

    // Act：加上待取餐篩選。
    await orders.chooseTab('待取餐');

    // Assert：只顯示同時符合搜尋與待取餐狀態的訂單。
    await orders.expectRows([ready.id]);
    await expect(orders.row(cooking.id)).toHaveCount(0);
    await expect(orders.statusOf(ready.id)).toHaveText('待取餐');

    // Act：改為搜尋備餐中訂單的顧客，保留狀態篩選。
    await orders.search(all.find((order) => order.id === cooking.id)!.customer.name);

    // Assert：該顧客的訂單不符合待取餐條件。
    await orders.expectRows([]);

    // Act：搜尋待取餐訂單的顧客。
    await orders.search(all.find((order) => order.id === ready.id)!.customer.name);

    // Assert：仍只顯示該顧客的待取餐訂單。
    await orders.expectRows([ready.id]);
  });
});

import { randomUUID } from 'node:crypto';
import type { MealView, OrderView } from '../support/api';
import { test as base, World, type Restaurant } from '../support/base-fixtures';
import { accountsFor, testPassword } from '../support/env';

const accountSet = 'CH20-T01';

export function restaurantCredentials() {
  return {
    username: accountsFor(accountSet).restaurantA,
    password: testPassword(),
  };
}

export const test = base.extend<{
  world: World;
  restaurant: Restaurant;
  meal: MealView;
  order: OrderView;
  otherOrder: OrderView;
  cookingOrder: OrderView;
}>({
  world: async ({ api }, use) => {
    await use(new World(api, accountSet));
  },
  restaurant: async ({ world }, use) => {
    await use(await world.restaurant());
  },
  meal: async ({ world, restaurant }, use) => {
    const meal = await world.meal(restaurant, {
      name: `雞腿便當 ${randomUUID().slice(0, 8)}`,
      price: 100,
    });
    await use(meal);
  },
  order: async ({ world, restaurant, meal }, use) => {
    const address = `台北市示範路 1 號（${randomUUID()}）`;
    await use(await world.order(restaurant, 'customerA', address, meal.id));
  },
  otherOrder: async ({ world, restaurant, meal }, use) => {
    const address = `台北市示範路 2 號（${randomUUID()}）`;
    await use(await world.order(restaurant, 'customerB', address, meal.id));
  },
  cookingOrder: async ({ api, restaurant, meal }, use) => {
    // 顧客有未完成的訂單時無法再訂餐，備餐演練使用自己的顧客帳號。
    const world = new World(api, 'CH15-T04');
    const address = `台北市示範路 3 號（${randomUUID()}）`;
    await use(await world.order(restaurant, 'customerA', address, meal.id));
  },
});

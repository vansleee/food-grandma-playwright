import type { MealView, OrderView } from '../../support/api';
import { World, test as base } from '../../support/base-fixtures';

export const test = base.extend<{
  orders: { target: OrderView; other: OrderView };
  meal: MealView;
}>({
  orders: async ({ api }, use) => {
    const world = new World(api, 'CH05');
    const restaurant = await world.restaurant();
    const meal = await world.meal(restaurant, { name: '招牌便當', price: 100 });
    const other = await world.order(restaurant, 'customerA', '示範路甲號', meal.id);
    const target = await world.order(restaurant, 'customerB', '示範路乙號', meal.id);
    await use({ target, other });
  },
  meal: async ({ api }, use) => {
    const world = new World(api, 'CH05');
    const restaurant = await world.restaurant();
    const meal = await world.meal(restaurant, { name: '雞腿便當', price: 100 });
    await use(meal);
  },
});

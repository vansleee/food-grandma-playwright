import type { Page } from '@playwright/test';
import { test as base, World } from '../support/test';
import type { OrderInput } from './customerworkflows';
import { RoleSessions } from './role-sessions';

export type RolePages = { customer: Page; manager: Page; driver: Page };

type ExtraPages = { customer: Page; driver: Page };

export const test = base.extend<{ sessions: RoleSessions; actorsPages: RolePages; extraPages: ExtraPages; scenario: OrderInput }>({
  sessions: async ({ browser, baseURL }, use, info) => {
    const sessions = new RoleSessions(browser, { baseURL });
    try { await use(sessions); }
    finally { await sessions.dispose(info); }
  },
  actorsPages: async ({ sessions, api, caseId, restaurant }, use) => {
    const world = new World(api, caseId);
    await use({
      customer: await sessions.open('customerA', 'food_alpaca_customer_token', await world.token('customerA')),
      manager: await sessions.open('manager', 'food_grandma_restaurant_token', restaurant.token),
      driver: await sessions.open('driverA', 'food_alpaca_driver_token', await world.token('driverA')),
    });
  },
  extraPages: async ({ sessions, api, caseId }, use) => {
    const world = new World(api, caseId);
    await use({
      customer: await sessions.open('customerB', 'food_alpaca_customer_token', await world.token('customerB')),
      driver: await sessions.open('driverB', 'food_alpaca_driver_token', await world.token('driverB')),
    });
  },
  scenario: async ({ api, restaurant, caseId }, use) => {
    const profile = await api.restaurantMe(restaurant.token);
    const meal = await api.createMeal(restaurant.token, {
      name: '香煎雞腿便當', short_description: '附白飯與三樣配菜', price: 120, image: '',
    });
    const driver = await api.driverProfile(await new World(api, caseId).token('driverA'));
    await use({ restaurantName: profile.restaurant.name, mealId: meal.id, mealName: meal.name,
      address: `${caseId} 測試用配送地址`, total: meal.price, driverId: driver.id });
  },
});

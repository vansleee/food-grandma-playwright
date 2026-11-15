import { expect, type Page } from '@playwright/test';
import { createBdd, test as base } from 'playwright-bdd';
import { Api, type MealView } from '../../../support/api';
import { World, type Restaurant } from '../../../support/base-fixtures';
import { readCustomerOrders } from '../support/orders-db';

interface CheckoutData {
  world: World;
  restaurant: Restaurant;
  meal: MealView;
}

interface Scenario {
  checkout?: CheckoutData;
  displayedOrderId?: number;
  existingOrderId?: number;
}

export const test = base.extend<{ scenario: Scenario }>({
  scenario: async ({}, use) => {
    await use({});
  },
});
const { Given, When, Then } = createBdd(test);

function checkoutData(scenario: Scenario): CheckoutData {
  if (!scenario.checkout) throw new Error('請先準備顧客帳號與餐點。');
  return scenario.checkout;
}

async function submitOrder(page: Page, address: string) {
  await page.getByLabel('配送地址').fill(address);
  await page.getByRole('button', { name: '確認送出訂單' }).click();
}

Given(/^我以「([^」]+)」的顧客帳號登入，餐廳供應一份 100 元的招牌便當$/, async ({ page, request, scenario }, caseId: string) => {
  const world = new World(new Api(request), caseId);
  const restaurant = await world.restaurant();
  const meal = await world.meal(restaurant, { name: '招牌便當', price: 100 });
  const customerToken = await world.token('customerA');
  await page.goto(`/customer/restaurants/${restaurant.id}/meals`);
  await page.evaluate((token) => localStorage.setItem('food_alpaca_customer_token', token), customerToken);
  scenario.checkout = { world, restaurant, meal };
});

Given('我已有一筆未完成的招牌便當訂單', async ({ scenario }) => {
  const { world, restaurant, meal } = checkoutData(scenario);
  const order = await world.order(restaurant, 'customerA', '第六章示範路原訂單', meal.id);
  scenario.existingOrderId = order.id;
});

When('我把一份招牌便當加入購物車', async ({ page }) => {
  await page.getByTestId('meal-card').filter({ hasText: '招牌便當' })
    .getByRole('button', { name: /加入購物車/ }).click();
  await page.getByRole('button', { name: /查看購物車/ }).click();
  await page.getByRole('button', { name: '前往結帳' }).click();
});

When(/^我用配送地址「([^」]+)」送出訂單$/, async ({ page }, address: string) => {
  await submitOrder(page, address);
});

When('我用只有空白的配送地址送出訂單', async ({ page }) => {
  await submitOrder(page, '   ');
});

Then('「訂單進度」頁面應顯示這筆訂單', async ({ page, scenario }) => {
  await expect(page.getByRole('heading', { name: '訂單進度' })).toBeVisible();
  const number = page.getByTestId('delivery-card').getByText(/^訂單 #\d+$/);
  await expect(number).toBeVisible();
  scenario.displayedOrderId = Number((await number.innerText()).split('#')[1]);
});

Then(/^資料庫應有同一個訂單編號、地址「([^」]+)」和 (\d+) 份招牌便當，合計 (\d+) 元$/, async ({ scenario }, address: string, quantity: string, total: string) => {
  const { world, restaurant, meal } = checkoutData(scenario);
  expect(scenario.displayedOrderId).toBeGreaterThan(0);
  const orders = readCustomerOrders(world.accounts.customerA);
  expect(orders).toEqual([{
    id: scenario.displayedOrderId,
    restaurant_id: restaurant.id,
    address,
    meal_id: meal.id,
    quantity: Number(quantity),
    total: Number(total),
  }]);
});

Then(/^畫面應停在確認訂單頁面並顯示「([^」]+)」$/, async ({ page }, message: string) => {
  await expect(page).toHaveURL(/\/customer\/checkout$/);
  await expect(page.getByTestId('checkout-error')).toHaveText(message);
});

Then('資料庫應查不到這位顧客的訂單', async ({ scenario }) => {
  const { world } = checkoutData(scenario);
  expect(readCustomerOrders(world.accounts.customerA)).toHaveLength(0);
});

Then('資料庫應只保留原本那筆訂單', async ({ scenario }) => {
  const { world } = checkoutData(scenario);
  expect(scenario.existingOrderId).toBeGreaterThan(0);
  const orders = readCustomerOrders(world.accounts.customerA);
  expect(orders.map(({ id }) => id)).toEqual([scenario.existingOrderId]);
});

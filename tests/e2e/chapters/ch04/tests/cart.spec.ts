import { expect, test, type APIRequestContext } from '@playwright/test';
import { Api } from '../../support/api';
import { accountsFor } from '../../support/env';

async function prepareMenu(request: APIRequestContext, username: string) {
  const api = new Api(request);
  const token = await api.login(username);
  const { restaurant } = await api.restaurantMe(token);
  await api.createMeal(token, { name: '瑪格麗特披薩', price: 100 });
  await api.createMeal(token, { name: '可樂', price: 50 });
  return restaurant.id;
}

test('練習 3 AAA：加入第二件商品後，購物車合計為 150 元', async ({ page, request }) => {
  // Arrange：準備兩項餐點，先把 100 元的披薩加入購物車。
  const restaurantId = await prepareMenu(request, accountsFor('CH04').restaurantA);
  await page.goto(`/customer/restaurants/${restaurantId}/meals`);
  await page.getByTestId('meal-card').filter({ hasText: '瑪格麗特披薩' })
    .getByRole('button', { name: /加入購物車/ }).click();

  // Act：再加入 50 元的可樂，開啟購物車。
  await page.getByTestId('meal-card').filter({ hasText: '可樂' })
    .getByRole('button', { name: /加入購物車/ }).click();
  await page.getByRole('button', { name: /查看購物車/ }).click();

  // Assert：餐點合計應為 150 元。
  await expect(page.getByTestId('cart-total')).toHaveText('餐點合計：$150.00');
});

test('練習 3 Given-When-Then：加入第二件商品後，購物車合計為 150 元', async ({ page, request }) => {
  // Given：購物車中已有一份 100 元的瑪格麗特披薩。
  const restaurantId = await prepareMenu(request, accountsFor('CH04').restaurantB);
  await page.goto(`/customer/restaurants/${restaurantId}/meals`);
  await page.getByTestId('meal-card').filter({ hasText: '瑪格麗特披薩' })
    .getByRole('button', { name: /加入購物車/ }).click();

  // When：再加入一份 50 元的可樂並查看購物車。
  await page.getByTestId('meal-card').filter({ hasText: '可樂' })
    .getByRole('button', { name: /加入購物車/ }).click();
  await page.getByRole('button', { name: /查看購物車/ }).click();

  // Then：餐點合計應為 150 元。
  await expect(page.getByTestId('cart-total')).toHaveText('餐點合計：$150.00');
});

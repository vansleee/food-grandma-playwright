import type { MealView } from '../../support/api';
import { MealFormPage, MealsPage, openManagementAs } from '../../support/pages';
import { expect, test, World } from '../../support/test';

test.describe('v2 共用餐點的反例', () => {
  let restaurantToken: string;
  let sharedMeal: MealView;

  test.beforeAll(async ({ api }) => {
    const world = new World(api, 'CH34-T01');
    const restaurant = await world.restaurant();
    restaurantToken = restaurant.token;
    sharedMeal = await api.createMeal(restaurantToken, { name: '雞腿便當', price: 100 });
  });

  for (const price of [150, 180]) {
    test(`共用餐點：將 100 元改為 ${price} 元`, async ({ page, api }) => {
      // Arrange：兩支測試都開啟同一筆餐點，並預期原價是 100 元。
      const meals = new MealsPage(page);
      const form = new MealFormPage(page);
      await openManagementAs(page, restaurantToken, '/management/meals');
      await meals.waitUntilLoaded();
      await meals.row(sharedMeal.id).getByTestId('meal-edit-link').click();
      await expect(form.price()).toHaveValue('100');

      // Act：從網頁修改價格並儲存。
      await form.price().fill(String(price));
      await form.submit().click();

      // Assert：依原編號核對儲存後的資料。
      await expect(page).toHaveURL(/\/management\/meals$/);
      const saved = (await api.listMeals(restaurantToken)).find(({ id }) => id === sharedMeal.id);
      expect(saved).toEqual({ ...sharedMeal, price });
    });
  }
});

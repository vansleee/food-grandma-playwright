import { expectStoredMeal } from '../support/meal-assertions';
import { MealFormPage, MealsPage, openManagementAs } from '../support/pages';
import { expect, test } from '../support/test';

test.describe('未使用本章模式', () => {
  test('CH28-T01 將原價格 100 修改為 150', async ({ page, api, restaurant, subject }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const { original, idsBefore } = subject;
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals');
    await meals.waitUntilLoaded();
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.name()).toHaveValue(original.name);
    await expect(form.description()).toHaveValue(original.short_description);
    await expect(form.price()).toHaveValue('100');

    // Act：在網頁修改價格並儲存。
    await form.price().fill(String(150));
    await form.submit().click();

    // Assert：更新原餐點、不重複新增，重新開啟後仍為新價格。
    await expect(page).toHaveURL(/\/management\/meals$/);
    await expect(meals.row(original.id)).toContainText('$' + 150);
    await expectStoredMeal(api, restaurant.token, original, idsBefore, 150);
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.price()).toHaveValue(String(150));
  });

  test('CH28-T02 將原價格 100 修改為 0', async ({ page, api, restaurant, subject }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const { original, idsBefore } = subject;
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals');
    await meals.waitUntilLoaded();
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.name()).toHaveValue(original.name);
    await expect(form.description()).toHaveValue(original.short_description);
    await expect(form.price()).toHaveValue('100');

    // Act：在網頁修改價格並儲存。
    await form.price().fill(String(0));
    await form.submit().click();

    // Assert：更新原餐點、不重複新增，重新開啟後仍為新價格。
    await expect(page).toHaveURL(/\/management\/meals$/);
    await expect(meals.row(original.id)).toContainText('$' + 0);
    await expectStoredMeal(api, restaurant.token, original, idsBefore, 0);
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.price()).toHaveValue(String(0));
  });
});

test.describe('v1', () => {
  for (const [index, price] of [150, 0].entries()) {
    test(`CH28-T0${index + 1} 將原價格 100 修改為 ${price}`, async ({ page, api, restaurant, subject }, info) => {
      // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
      const { original, idsBefore } = subject;
      const meals = new MealsPage(page);
      const form = new MealFormPage(page);
      await openManagementAs(page, restaurant.token, '/management/meals');
      await meals.waitUntilLoaded();
      await meals.row(original.id).getByTestId('meal-edit-link').click();
      await expect(form.name()).toHaveValue(original.name);
      await expect(form.description()).toHaveValue(original.short_description);
      await expect(form.price()).toHaveValue('100');

      // Act：在網頁修改價格並儲存。
      await form.price().fill(String(price));
      await form.submit().click();

      // Assert：更新原餐點、不重複新增，重新開啟後仍為新價格。
      await expect(page).toHaveURL(/\/management\/meals$/);
      await expect(meals.row(original.id)).toContainText('$' + price);
      await expectStoredMeal(api, restaurant.token, original, idsBefore, price);
      await meals.row(original.id).getByTestId('meal-edit-link').click();
      await expect(form.price()).toHaveValue(String(price));
    });
  }
});

test.describe('v2', () => {
  for (const [index, price] of [150, 0].entries()) {
    test(`CH28-T0${index + 1} 將原價格 100 修改為 ${price}`, async ({ page, api, restaurant, subject }, info) => {
      // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
      const { original, idsBefore } = subject;
      const meals = new MealsPage(page);
      const form = new MealFormPage(page);
      await openManagementAs(page, restaurant.token, '/management/meals');
      await meals.waitUntilLoaded();
      await meals.row(original.id).getByTestId('meal-edit-link').click();
      await expect(form.name()).toHaveValue(original.name);
      await expect(form.description()).toHaveValue(original.short_description);
      await expect(form.price()).toHaveValue('100');

      // Act：在網頁修改價格並儲存。
      await form.price().fill(String(price));
      await form.submit().click();

      // Assert：更新原餐點、不重複新增，重新開啟後仍為新價格。
      await expect(page).toHaveURL(/\/management\/meals$/);
      await expect(meals.row(original.id)).toContainText('$' + price);
      await expectStoredMeal(api, restaurant.token, original, idsBefore, price);
      await meals.row(original.id).getByTestId('meal-edit-link').click();
      await expect(form.price()).toHaveValue(String(price));
    });
  }
});

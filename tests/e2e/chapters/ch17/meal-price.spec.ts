import type { Page } from '@playwright/test';
import { expectStoredMeal } from '../support/meal-assertions';
import { MealFormPage, MealsPage, openManagementAs } from '../support/pages';
import { expect, test } from '../support/test';

test.describe('未使用本章模式', () => {
  test('CH22-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, subject }, info) => {
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
});

test.describe('v1', () => {
  test('CH22-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, subject }, info) => {
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
});

test.describe('v2（Page Factory 教學延伸）', () => {
  class FoodGrandmaPages {
    readonly meals: MealsPage;
    readonly mealForm: MealFormPage;

    constructor(page: Page) {
      this.meals = new MealsPage(page);
      this.mealForm = new MealFormPage(page);
    }
  }
  test('CH22-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, subject }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const { original, idsBefore } = subject;
    const pages = new FoodGrandmaPages(page);
    const meals = pages.meals;
    const form = pages.mealForm;
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
});

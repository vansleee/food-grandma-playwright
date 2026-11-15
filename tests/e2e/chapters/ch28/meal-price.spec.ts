import type { Page } from '@playwright/test';
import { expectStoredMeal } from '../support/meal-assertions';
import { MealFormPage, MealsPage, openManagementAs } from '../support/pages';
import { expect, test } from '../support/test';

test.describe('未整理網頁步驟', () => {
  test('CH36-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, subject }, info) => {
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
  test('CH36-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, subject }, info) => {
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

test.describe('v2（Workflow 教學延伸）', () => {
  class MealPriceWorkflow {
    readonly meals: MealsPage;
    readonly form: MealFormPage;
    constructor(private readonly page: Page) {
      this.meals = new MealsPage(page);
      this.form = new MealFormPage(page);
    }
    async openEditor(token: string, id: number) {
      await openManagementAs(this.page, token, '/management/meals');
      await this.meals.waitUntilLoaded();
      await this.meals.row(id).getByTestId('meal-edit-link').click();
    }
    async changePrice(price: number) {
      await this.form.price().fill(String(price));
      await this.form.submit().click();
    }
  }
  test('CH36-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, subject }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const { original, idsBefore } = subject;
    const workflow = new MealPriceWorkflow(page);
    const { meals, form } = workflow;
    await workflow.openEditor(restaurant.token, original.id);
    await expect(form.name()).toHaveValue(original.name);
    await expect(form.description()).toHaveValue(original.short_description);
    await expect(form.price()).toHaveValue('100');

    // Act：在網頁修改價格並儲存。
    await workflow.changePrice(150);

    // Assert：更新原餐點、不重複新增，重新開啟後仍為新價格。
    await expect(page).toHaveURL(/\/management\/meals$/);
    await expect(meals.row(original.id)).toContainText('$' + 150);
    await expectStoredMeal(api, restaurant.token, original, idsBefore, 150);
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.price()).toHaveValue(String(150));
  });
});

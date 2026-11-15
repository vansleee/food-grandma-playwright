import type { MealInput } from '../support/api';
import { expectStoredMeal } from '../support/meal-assertions';
import { MealFormPage, MealsPage, openManagementAs } from '../support/pages';
import { expect, test } from '../support/test';

test.describe('未使用本章模式', () => {
  test('CH29-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, caseId, request }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const input = { name: `${caseId} meal ${info.repeatEachIndex + 1}`, short_description: `${caseId} original description`, image: '', price: 100 };
    const original = await api.createMeal(restaurant.token, input);
    const idsBefore = (await api.listMeals(restaurant.token)).map((meal) => meal.id).sort((a, b) => a - b);
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
  test('CH29-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, caseId, request }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const input = { name: `${caseId} meal ${info.repeatEachIndex + 1}`, short_description: `${caseId} original description`, image: '', price: 100 };
    const original = await api.createMeal(restaurant.token, input);
    const idsBefore = (await api.listMeals(restaurant.token)).map((meal) => meal.id).sort((a, b) => a - b);
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

test.describe('v2', () => {
  type MealDraft = Required<MealInput>;


  class MealBuilder {
    private value: MealDraft;

    constructor(label: string) {
      this.value = {
        name: `${label} Meal`,
        short_description: `${label} description`,
        image: '',
        price: 100,
      };
    }

    named(name: string) {
      this.value.name = name;
      return this;
    }
    described(description: string) {
      this.value.short_description = description;
      return this;
    }
    priced(price: number) {
      this.value.price = price;
      return this;
    }
    build(): MealDraft {
      return { ...this.value };
    }
  }
  test('CH29-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, caseId, request }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const input = new MealBuilder(caseId).named(`${caseId} meal ${info.repeatEachIndex + 1}`).described(`${caseId} original description`).priced(100).build();
    const original = await api.createMeal(restaurant.token, input);
    const idsBefore = (await api.listMeals(restaurant.token)).map((meal) => meal.id).sort((a, b) => a - b);
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

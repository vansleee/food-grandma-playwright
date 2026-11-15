import type { MealView } from '../../support/api';
import { expectStoredMeal } from '../../support/meal-assertions';
import { MealFormPage, MealsPage, openManagementAs } from '../../support/pages';
import { expect, test } from '../../support/test';

test.describe('未使用條件等待（固定等待反例）', () => {
  test('CH35-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, subject }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const { original, idsBefore } = subject;
    const delayMs = info.repeatEachIndex % 2 === 0 ? 900 : 0;
    await page.route(new RegExp(`/api/restaurant/meals/${original.id}$`), async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue().catch(() => { });
    });
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals');
    await meals.waitUntilLoaded();
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await page.waitForTimeout(200);
    expect(await form.name().inputValue()).toBe(original.name);
    expect(await form.description().inputValue()).toBe(original.short_description);
    expect(await form.price().inputValue()).toBe('100');
    await page.unrouteAll({ behavior: 'wait' });

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

import type { Page, TestInfo } from '@playwright/test';
import { test, expect, World } from '../../baseline/tests/support/fixtures';
import type { MealView } from '../../baseline/tests/support/api';
import { MealFormPage, MealsPage, openManagementAs } from '../../baseline/tests/support/pages';
import experiment from '../../experiment.json';

export type OriginalPriceWait = (page: Page, form: MealFormPage, original: MealView) => Promise<string>;

export function registerPriceCase(waitForOriginal: OriginalPriceWait) {
  test('FLAKY-T01 等待原有餐點資料後，從網頁把價格由 100 修改為 150', async ({ page, api }, testInfo: TestInfo) => {
    const delay = experiment.response_delay_schedule_ms[testInfo.repeatEachIndex];
    if (delay === undefined) throw new Error('Repeat index exceeds the planned delay schedule');
    testInfo.annotations.push({ type: 'response-delay-ms', description: String(delay) });
    const world = new World(api, 'FLAKY-T01');
    const restaurant = await world.restaurant();
    const original = await world.meal(restaurant, {
      name: `FLAKY-T01 repeat ${testInfo.repeatEachIndex}`,
      short_description: 'Keep the original description',
      price: 100,
    });
    const idsBefore = (await api.listMeals(restaurant.token)).map((meal) => meal.id).sort((a, b) => a - b);
    const form = new MealFormPage(page);
    const meals = new MealsPage(page);

    // 延遲真實 GET，不模擬餐點內容或成功儲存結果。兩版使用同一份延遲順序。
    const url = new RegExp(`/api/restaurant/meals/${original.id}$`);
    await page.route(url, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        await route.continue();
      } catch (error) {
        if (!page.isClosed()) throw error;
      }
    });

    await openManagementAs(page, restaurant.token, `/management/meals/${original.id}/edit`);
    await expect(form.price()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('01-edit-opened.png') });
    const observed = await waitForOriginal(page, form, original);
    await testInfo.attach('observation.json', {
      contentType: 'application/json',
      body: JSON.stringify({ repeat: testInfo.repeatEachIndex + 1, responseDelayMs: delay,
        mealId: original.id, expectedPrice: '100', observedPrice: observed }, null, 2),
    });
    await page.screenshot({ path: testInfo.outputPath('02-original-price-check.png') });
    expect(observed, '餐點資料載入後，原價格應為 100').toBe('100');
    await expect(form.name()).toHaveValue(original.name);
    await expect(form.description()).toHaveValue(original.short_description);

    // 等本次模擬中的 GET 全部結束後移除攔截，避免控制程式影響後續儲存與重新開啟。
    await page.unrouteAll({ behavior: 'wait' });
    await form.price().fill('150');
    await page.screenshot({ path: testInfo.outputPath('03-before-save.png') });
    await form.submit().click();
    await expect(page).toHaveURL(/\/management\/meals$/);
    await meals.waitUntilLoaded();
    await expect(meals.row(original.id)).toContainText('$150');
    const all = await api.listMeals(restaurant.token);
    expect(all.map((meal) => meal.id).sort((a, b) => a - b)).toEqual(idsBefore);
    expect(all.find((meal) => meal.id === original.id)).toMatchObject({
      id: original.id, name: original.name, short_description: original.short_description, price: 150,
    });
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.price()).toHaveValue('150');
    await expect(form.name()).toHaveValue(original.name);
    await expect(form.description()).toHaveValue(original.short_description);
    await page.screenshot({ path: testInfo.outputPath('04-reopened.png') });
  });
}

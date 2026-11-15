import { MealFormPage, MealsPage, openManagementAs } from '../../baseline/tests/support/pages';
import { labTest, expect } from './test-base';

// before 與 after 共用相同流程與預期結果，差別只有 subject Fixture。
export function registerPriceCases(test: typeof labTest) {
  for (const scenario of [
    { id: 'PAR-T01', price: 150 },
    { id: 'PAR-T02', price: 180 },
  ]) {
    test(`${scenario.id} 修改餐點價格為 ${scenario.price}`, async ({ page, api, subject, meet }, testInfo) => {
      const { restaurant, meal } = subject;
      const meals = new MealsPage(page);
      const form = new MealFormPage(page);
      await openManagementAs(page, restaurant.token, '/management/meals');
      await meals.waitUntilLoaded();
      await meals.row(meal.id).getByTestId('meal-edit-link').click();
      await expect(form.name()).toHaveValue(meal.name);
      await expect(form.description()).toHaveValue(meal.short_description);
      await expect(form.price()).toHaveValue('100');
      await meet('loaded');

      await form.price().fill(String(scenario.price));
      await page.screenshot({ path: testInfo.outputPath('01-before-save.png') });
      const update = page.waitForResponse((response) =>
        response.request().method() === 'PUT' && response.url().endsWith(`/api/restaurant/meals/${meal.id}`));
      await form.submit().click();
      const response = await update;
      const savedBody = await response.json();
      expect(response.status()).toBe(200);
      await expect(page).toHaveURL(/\/management\/meals$/);
      await meals.waitUntilLoaded();
      await meet('saved');

      const all = await api.listMeals(restaurant.token);
      const actual = all.find((candidate) => candidate.id === meal.id);
      await testInfo.attach('observation.json', {
        contentType: 'application/json',
        body: JSON.stringify({ caseId: scenario.id, mealId: meal.id, expectedPrice: scenario.price,
          observedPrice: actual?.price, saveResponse: savedBody, workers: testInfo.config.workers }, null, 2),
      });
      await page.screenshot({ path: testInfo.outputPath('02-after-save.png') });
      expect(actual?.price, `餐點 ${meal.id} 應保留本案例儲存的價格`).toBe(scenario.price);
      expect(actual).toMatchObject({ id: meal.id, name: meal.name, short_description: meal.short_description });
      expect(all).toHaveLength(1);
      await expect(meals.row(meal.id)).toContainText(`$${scenario.price}`);
      await meals.row(meal.id).getByTestId('meal-edit-link').click();
      await expect(form.price()).toHaveValue(String(scenario.price));
      await page.screenshot({ path: testInfo.outputPath('03-reopened.png') });
    });
  }
}

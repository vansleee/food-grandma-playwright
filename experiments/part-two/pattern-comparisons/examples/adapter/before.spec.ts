import { test, scenarios } from '../../support/fixtures';
import { MealFormPage, MealsPage, openManagementAs } from '../../baseline/tests/support/pages';
import { capture, expectOriginal, watchMealSave, verifyEditedMeal } from '../../support/meal-checks';

for (const scenario of scenarios) {
  test(`ADAPT-${scenario.suffix} 從網頁將既有餐點價格由 100 修改為 ${scenario.price}`, async ({ page, api, restaurant, caseId }, testInfo) => {
    const draft = { title: `${caseId} meal`, description: `${caseId} original description`, imageUrl: '', amount: 100 };
    const original = await api.createMeal(restaurant.token, {
      name: draft.title, short_description: draft.description, image: draft.imageUrl, price: draft.amount,
    });
    const idsBefore = (await api.listMeals(restaurant.token)).map((meal) => meal.id).sort((a, b) => a - b);
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals');
    await meals.waitUntilLoaded();
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expectOriginal(form, original);
    await capture(page, testInfo, '01-editor-before-change.png');
    await form.price().fill(String(scenario.price));
    const pending = watchMealSave(page, original.id);
    await form.submit().click();
    const saved = await pending;
    await verifyEditedMeal({ page, info: testInfo, original, idsBefore, price: scenario.price, saved,
      readMeals: () => api.listMeals(restaurant.token) });
  });
}

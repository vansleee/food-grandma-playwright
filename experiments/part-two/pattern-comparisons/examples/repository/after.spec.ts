import { test, scenarios, mealInput } from '../../support/fixtures';
import { MealFormPage, MealsPage, openManagementAs } from '../../baseline/tests/support/pages';
import { capture, expectOriginal, watchMealSave, verifyEditedMeal } from '../../support/meal-checks';
import { ApiMealsRepository, prepareMealForEditing } from './meals-repository';

for (const scenario of scenarios) {
  test(`REPO-${scenario.suffix} 從網頁將既有餐點價格由 100 修改為 ${scenario.price}`, async ({ page, api, request, restaurant, caseId }, testInfo) => {
    const repository = new ApiMealsRepository(api, request, restaurant.token);
    const { original, idsBefore } = await prepareMealForEditing(repository, mealInput(caseId));
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
      readMeals: () => repository.all() });
  });
}

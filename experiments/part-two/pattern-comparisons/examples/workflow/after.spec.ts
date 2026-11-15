import { test, scenarios, arrangeMeal } from '../../support/fixtures';
import { capture, expectOriginal, verifyEditedMeal } from '../../support/meal-checks';
import { MealPriceWorkflow } from './meal-price-workflow';

for (const scenario of scenarios) {
  test(`FLOW-${scenario.suffix} 從網頁將既有餐點價格由 100 修改為 ${scenario.price}`, async ({ page, api, restaurant, caseId }, testInfo) => {
    const { original, idsBefore } = await arrangeMeal(api, restaurant, caseId);
    const workflow = new MealPriceWorkflow(page);
    await workflow.openEditor(restaurant.token, original.id);
    await expectOriginal(workflow.form, original);
    await capture(page, testInfo, '01-editor-before-change.png');
    const saved = await workflow.changePrice(original.id, scenario.price);
    await verifyEditedMeal({ page, info: testInfo, original, idsBefore, price: scenario.price, saved,
      readMeals: () => api.listMeals(restaurant.token) });
  });
}

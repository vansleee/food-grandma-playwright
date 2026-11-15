import { test, expect, scenarios, arrangeMeal } from '../../support/fixtures';
import { capture, watchMealSave, verifyEditedMeal } from '../../support/meal-checks';
import { Actor, OpenMealEditor, ChangeMealPrice, MealDetails } from './screenplay';

for (const scenario of scenarios) {
  test(`SCREEN-${scenario.suffix} 從網頁將既有餐點價格由 100 修改為 ${scenario.price}`, async ({ page, api, restaurant, caseId }, testInfo) => {
    const { original, idsBefore } = await arrangeMeal(api, restaurant, caseId);
    const restaurantActor = new Actor('餐廳管理者', page);
    await restaurantActor.attemptsTo(OpenMealEditor(restaurant.token, original.id));
    await expect.poll(() => restaurantActor.asks(MealDetails())).toEqual({
      name: original.name, short_description: original.short_description, image: original.image, price: '100',
    });
    await capture(page, testInfo, '01-editor-before-change.png');
    const pending = watchMealSave(page, original.id);
    await restaurantActor.attemptsTo(ChangeMealPrice(scenario.price));
    const saved = await pending;
    await verifyEditedMeal({ page, info: testInfo, original, idsBefore, price: scenario.price, saved,
      readMeals: () => api.listMeals(restaurant.token) });
  });
}

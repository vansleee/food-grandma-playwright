import { ApiMealsRepository } from '../../ch25/repository/api-meals-repository';
import { expect, test } from '../../support/test';
import { MealFormPage, MealsPage, openManagementAs } from '../../support/pages';

test.describe('未整理網頁步驟', () => {
  test('CH36-T01 將原餐點的價格從 100 改為 150', async ({ page, api, restaurant }) => {
    // Arrange：建立一筆 100 元的雞腿便當，再確認編輯頁面載入原值。
    const repository = new ApiMealsRepository(api, restaurant.token);
    const original = await repository.add({
      name: '雞腿便當',
      short_description: '本次測試使用的餐點',
      price: 100,
    });
    const before = await api.listMeals(restaurant.token);
    const idsBefore = before.map(({ id }) => id).sort((a, b) => a - b);

    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals');
    await meals.waitUntilLoaded();
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.name()).toHaveValue(original.name);
    await expect(form.description()).toHaveValue(original.short_description);
    await expect(form.price()).toHaveValue('100');

    // Act：從網頁修改價格並儲存。
    await form.price().fill('150');
    await form.submit().click();

    // Assert：清單沒有新增餐點，且原餐點只有價格改變。
    await expect(page).toHaveURL(/\/management\/meals$/);
    await expect(meals.row(original.id)).toContainText('$150');

    const updated = await repository.find(original.id);
    expect(updated).toEqual({ ...original, price: 150 });

    const after = await api.listMeals(restaurant.token);
    expect(after.map(({ id }) => id).sort((a, b) => a - b)).toEqual(idsBefore);

    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.price()).toHaveValue('150');
  });
});

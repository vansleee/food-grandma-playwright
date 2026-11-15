import { MealFormPage, MealsPage, openManagementAs } from '../../support/pages';
import { expect, test } from '../../support/test';
import { ApiMealsRepository } from './api-meals-repository';

test.describe('v2 使用 Repository', () => {
  test('CH32-T01 修改原餐點價格', async ({ page, api, restaurant }) => {
    // Arrange：建立一筆 100 元的雞腿便當。
    const input = {
      name: '雞腿便當',
      short_description: '本次測試使用的餐點',
      image: '',
      price: 100,
    };
    const repository = new ApiMealsRepository(api, restaurant.token);
    const original = await repository.add(input);

    // Act：從網頁開啟同一筆餐點，把價格改為 150 元並儲存。
    await openManagementAs(page, restaurant.token, '/management/meals');
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await meals.waitUntilLoaded();
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.price()).toHaveValue('100');
    await form.price().fill('150');
    await form.submit().click();
    await expect(page).toHaveURL(/\/management\/meals$/);

    // Assert：依原編號查回餐點，確認只有價格改變。
    const updated = await repository.find(original.id);
    expect(updated).toMatchObject({
      ...original,
      price: 150,
    });
  });
});

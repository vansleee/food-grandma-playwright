import { expect, type Page } from '@playwright/test';
import { MealFormPage, MealsPage, openManagementAs } from '../../baseline/tests/support/pages';
import { watchMealSave } from '../../support/meal-checks';

export class MealPriceWorkflow {
  readonly meals: MealsPage;
  readonly form: MealFormPage;

  constructor(private readonly page: Page) {
    this.meals = new MealsPage(page);
    this.form = new MealFormPage(page);
  }

  async openEditor(token: string, mealId: number) {
    await openManagementAs(this.page, token, '/management/meals');
    await this.meals.waitUntilLoaded();
    await this.meals.row(mealId).getByTestId('meal-edit-link').click();
    await expect(this.page).toHaveURL(new RegExp(`/management/meals/${mealId}/edit$`));
  }

  async changePrice(mealId: number, price: number) {
    await this.form.price().fill(String(price));
    const response = watchMealSave(this.page, mealId);
    await this.form.submit().click();
    await expect(this.page).toHaveURL(/\/management\/meals$/);
    return response;
  }
}

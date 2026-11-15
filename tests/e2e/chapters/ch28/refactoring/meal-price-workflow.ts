import type { Page } from '@playwright/test';
import { MealFormPage, MealsPage, openManagementAs } from '../../support/pages';

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
  }

  async savePrice(price: number) {
    await this.form.price().fill(String(price));
    await this.form.submit().click();
  }
}

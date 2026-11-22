import type { Page } from '@playwright/test';

export class MealsPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.getByTestId('nav-meals').click();
  }

  row(mealId: number) {
    return this.page.locator(`[data-testid="meal-row"][data-meal-id="${mealId}"]`);
  }
}

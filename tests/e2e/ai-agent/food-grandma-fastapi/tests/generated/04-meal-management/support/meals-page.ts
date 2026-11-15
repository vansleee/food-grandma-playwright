import { expect, type Locator, type Page } from "@playwright/test";
import type { Meal } from "./restaurant-meals";

// POM for /management/meals. Rows are located by data-meal-id, never by position.
export class MealsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/management/meals");
    await expect(this.page).toHaveURL(/\/management\/meals$/);
    await expect(this.page.getByRole("heading", { name: "餐點管理" })).toBeVisible();
  }

  row(id: number): Locator {
    return this.page.getByTestId("meal-row").and(this.page.locator(`[data-meal-id="${id}"]`));
  }

  async expectRow(meal: Meal, price: number): Promise<void> {
    const row = this.row(meal.id);
    await expect(row).toBeVisible();
    await expect(row).toContainText(`#${meal.id}`);
    await expect(row).toContainText(meal.name);
    await expect(row).toContainText(meal.short_description);
    await expect(row).toContainText(`$${price.toLocaleString()}`);
  }

  async openEdit(id: number): Promise<void> {
    await this.row(id).getByTestId("meal-edit-link").click();
  }
}

import { expect, type Locator, type Page, type Response } from "@playwright/test";

export type MealFormValues = { name: string; description: string; price: number };

// POM for /management/meals/{id}/edit.
// MealForm starts with name="" and price=0 and overwrites them once the meal is
// loaded, so callers must await expectLoaded() before editing.
export class MealFormPage {
  constructor(private readonly page: Page) {}

  private get nameInput(): Locator {
    return this.page.getByTestId("meal-name");
  }
  private get descriptionInput(): Locator {
    return this.page.getByTestId("meal-description");
  }
  private get priceInput(): Locator {
    return this.page.getByTestId("meal-price");
  }
  private get submitButton(): Locator {
    return this.page.getByTestId("meal-submit");
  }

  async goto(id: number): Promise<void> {
    await this.page.goto(`/management/meals/${id}/edit`);
  }

  async expectEditPage(id: number): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/management/meals/${id}/edit$`));
    await expect(this.page.getByRole("heading", { name: "編輯餐點" })).toBeVisible();
    await expect(this.submitButton).toHaveText("儲存餐點");
  }

  async expectLoaded(values: MealFormValues): Promise<void> {
    await expect(this.nameInput).toHaveValue(values.name);
    await expect(this.descriptionInput).toHaveValue(values.description);
    await expect(this.priceInput).toHaveValue(String(values.price));
    await expect(this.page.getByRole("alert")).toHaveCount(0);
  }

  async setPrice(price: number): Promise<void> {
    await this.priceInput.fill(String(price));
  }

  // Clicks save and returns the PUT response for the given meal.
  async save(id: number): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.request().method() === "PUT" && new URL(r.url()).pathname === `/api/restaurant/meals/${id}`,
      ),
      this.submitButton.click(),
    ]);
    return response;
  }

  async expectSavedAndReturnedToList(): Promise<void> {
    await expect(this.page).toHaveURL(/\/management\/meals$/);
  }
}

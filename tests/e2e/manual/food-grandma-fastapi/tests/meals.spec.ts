import { test, expect } from "./fixtures";

test.describe("Meals", () => {
  test("lists the seeded meals with price", async ({ authedPage: page }) => {
    await page.goto("/management/meals");

    const rows = page.getByTestId("meal-row");
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: "Margherita" })).toContainText("$10");
    await expect(rows.filter({ hasText: "Pepperoni" })).toContainText("$12");
  });

  test("adds a new meal and shows it in the list", async ({ authedPage: page }) => {
    await page.goto("/management/meals");

    await page.getByTestId("add-meal-link").click();
    await expect(page).toHaveURL(/\/meals\/add$/);

    await page.getByTestId("meal-name").fill("Hawaiian");
    await page.getByTestId("meal-description").fill("Ham & pineapple");
    await page.getByTestId("meal-price").fill("15");
    await page.getByTestId("meal-submit").click();

    await expect(page).toHaveURL(/\/meals$/);
    const row = page.getByTestId("meal-row").filter({ hasText: "Hawaiian" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Ham & pineapple");
    await expect(row).toContainText("$15");
  });

  test("edits an existing meal's name and price", async ({ authedPage: page }) => {
    await page.goto("/management/meals");

    await page.getByTestId("meal-row").filter({ hasText: "Margherita" }).getByTestId("meal-edit-link").click();
    await expect(page).toHaveURL(/\/meals\/\d+\/edit$/);

    // Form is pre-filled from the existing meal.
    await expect(page.getByTestId("meal-name")).toHaveValue("Margherita");
    await expect(page.getByTestId("meal-price")).toHaveValue("10");

    await page.getByTestId("meal-name").fill("Margherita Deluxe");
    await page.getByTestId("meal-price").fill("14");
    await page.getByTestId("meal-submit").click();

    await expect(page).toHaveURL(/\/meals$/);
    const row = page.getByTestId("meal-row").filter({ hasText: "Margherita Deluxe" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("$14");
  });
});

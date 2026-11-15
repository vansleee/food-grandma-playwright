import { test, expect, resetAndSeed } from "./fixtures";

test.describe("Orders dashboard", () => {
  test("lists the seeded order with its details, customer, and total", async ({ authedPage: page }) => {
    await page.goto("/management/orders");

    const row = page.locator('[data-testid="order-row"][data-order-id="1"]');
    await expect(row).toBeVisible();
    await expect(row).toContainText("Margherita");
    await expect(row).toContainText("Cathy Customer");
    await expect(row).toContainText("$20");
    await expect(row.getByTestId("order-status")).toContainText("備餐中");
    await expect(row.getByTestId("order-ready-button")).toBeVisible();
  });

  test("marking a cooking order ready flips its status and hides the action", async ({ authedPage: page }) => {
    await page.goto("/management/orders");

    const row = page.locator('[data-testid="order-row"][data-order-id="1"]');
    await row.getByTestId("order-ready-button").click();

    await expect(row.getByTestId("order-status")).toContainText("待取餐");
    await expect(row.getByTestId("order-ready-button")).toHaveCount(0);

    // Survives a reload — the status change was persisted, not just local state.
    await page.reload();
    await expect(
      page.locator('[data-testid="order-row"][data-order-id="1"]').getByTestId("order-status")
    ).toContainText("待取餐");
  });

  test("shows an empty state for a brand-new restaurant with no orders", async ({ page, request }) => {
    await resetAndSeed(request);
    await page.goto("/management/sign-up");
    await page.getByTestId("sign-up-username").fill("emptyorders");
    await page.getByTestId("sign-up-password").fill("s3cret-pass");
    await page.getByTestId("sign-up-email").fill("empty@example.com");
    await page.getByTestId("sign-up-restaurant-name").fill("Empty Diner");
    await page.getByTestId("sign-up-phone").fill("0900111111");
    await page.getByTestId("sign-up-address").fill("1 Empty St");
    await page.getByTestId("sign-up-submit").click();

    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByText("目前還沒有訂單")).toBeVisible();
  });
});

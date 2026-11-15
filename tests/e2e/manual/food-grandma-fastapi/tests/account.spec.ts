import { test, expect } from "./fixtures";

test.describe("Account", () => {
  test("loads the current restaurant profile", async ({ authedPage: page }) => {
    await page.goto("/management/account");

    await expect(page.getByTestId("account-restaurant-name")).toHaveValue("Pizza Palace");
    await expect(page.getByTestId("account-first-name")).toHaveValue("Owner");
  });

  test("updates and persists the restaurant profile", async ({ authedPage: page }) => {
    await page.goto("/management/account");

    await page.getByTestId("account-restaurant-name").fill("Pizza Palace Deluxe");
    await page.getByTestId("account-phone").fill("0911222333");
    await page.getByTestId("account-save").click();

    await expect(page.getByText("已儲存設定")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("account-restaurant-name")).toHaveValue("Pizza Palace Deluxe");
    await expect(page.getByTestId("account-phone")).toHaveValue("0911222333");
  });
});

import { test, expect } from "@playwright/test";

const API_BASE_URL = "http://localhost:8081";
const RESTAURANT_USERNAME = "admin";
const RESTAURANT_PASSWORD = "password@321";
const DEMO_RESET_KEY = process.env.DEMO_RESET_KEY ?? "local-dev-reset-key";

test.beforeEach(async ({ request }) => {
  const headers = { "X-Demo-Reset-Key": DEMO_RESET_KEY };
  expect((await request.post(`${API_BASE_URL}/api/test/reset`, { headers })).ok()).toBeTruthy();
  expect((await request.post(`${API_BASE_URL}/api/test/seed`, { headers })).ok()).toBeTruthy();
});

test.describe("Restaurant sign in", () => {
  test("signs in with valid credentials and lands on the orders dashboard", async ({ page }) => {
    // Arrange
    await page.goto("/management/sign-in");

    // Act
    await page.getByTestId("sign-in-username").fill(RESTAURANT_USERNAME);
    await page.getByTestId("sign-in-password").fill(RESTAURANT_PASSWORD);
    await page.getByTestId("sign-in-submit").click();

    // Assert
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByTestId("order-table")).toBeVisible();
  });

  test("shows an error and stays on the sign-in page for invalid credentials", async ({ page }) => {
    // Arrange
    await page.goto("/management/sign-in");

    // Act
    await page.getByTestId("sign-in-username").fill(RESTAURANT_USERNAME);
    await page.getByTestId("sign-in-password").fill("wrong-password");
    await page.getByTestId("sign-in-submit").click();

    // Assert
    await expect(page.getByTestId("sign-in-error")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });
});

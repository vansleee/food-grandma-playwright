import {
  test,
  expect,
  resetAndSeed,
  RESTAURANT_USERNAME,
  RESTAURANT_PASSWORD,
} from "./fixtures";

test.beforeEach(async ({ request }) => {
  await resetAndSeed(request);
});

test.describe("Restaurant sign in", () => {
  test("signs in with valid credentials and lands on the orders dashboard", async ({ page }) => {
    await page.goto("/management/sign-in");

    await page.getByTestId("sign-in-username").fill(RESTAURANT_USERNAME);
    await page.getByTestId("sign-in-password").fill(RESTAURANT_PASSWORD);
    await page.getByTestId("sign-in-submit").click();

    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByTestId("order-table")).toBeVisible();
    await expect(page.getByTestId("sidebar")).toBeVisible();
  });

  test("shows an error and stays on the sign-in page for a wrong password", async ({ page }) => {
    await page.goto("/management/sign-in");

    await page.getByTestId("sign-in-username").fill(RESTAURANT_USERNAME);
    await page.getByTestId("sign-in-password").fill("wrong-password");
    await page.getByTestId("sign-in-submit").click();

    await expect(page.getByTestId("sign-in-error")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("shows an error for an unknown username", async ({ page }) => {
    await page.goto("/management/sign-in");

    await page.getByTestId("sign-in-username").fill("no-such-restaurant");
    await page.getByTestId("sign-in-password").fill(RESTAURANT_PASSWORD);
    await page.getByTestId("sign-in-submit").click();

    await expect(page.getByTestId("sign-in-error")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("blocks submit via native validation when fields are empty", async ({ page }) => {
    await page.goto("/management/sign-in");

    await page.getByTestId("sign-in-submit").click();

    // Native `required` validation stops the form before the API call fires.
    await expect(page).toHaveURL(/\/sign-in$/);
    const isValid = await page
      .getByTestId("sign-in-username")
      .evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test("sign-up link navigates to the registration page", async ({ page }) => {
    await page.goto("/management/sign-in");

    await page.getByTestId("sign-up-link").click();

    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(page.getByTestId("sign-up-form")).toBeVisible();
  });
});

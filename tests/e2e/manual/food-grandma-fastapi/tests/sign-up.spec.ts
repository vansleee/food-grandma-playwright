import { test, expect, resetAndSeed, RESTAURANT_USERNAME } from "./fixtures";

test.beforeEach(async ({ request }) => {
  await resetAndSeed(request);
});

test.describe("Restaurant sign up", () => {
  test("registers a new restaurant and lands on the orders dashboard", async ({ page }) => {
    await page.goto("/management/sign-up");

    await page.getByTestId("sign-up-username").fill("newowner");
    await page.getByTestId("sign-up-password").fill("s3cret-pass");
    await page.getByTestId("sign-up-first-name").fill("New");
    await page.getByTestId("sign-up-last-name").fill("Owner");
    await page.getByTestId("sign-up-email").fill("newowner@example.com");
    await page.getByTestId("sign-up-restaurant-name").fill("New Diner");
    await page.getByTestId("sign-up-phone").fill("0900999999");
    await page.getByTestId("sign-up-address").fill("1 New St");
    await page.getByTestId("sign-up-submit").click();

    await expect(page).toHaveURL(/\/orders$/);
    // A brand-new restaurant has no orders yet.
    await expect(page.getByText("目前還沒有訂單")).toBeVisible();
  });

  test("shows an error when the username is already taken", async ({ page }) => {
    await page.goto("/management/sign-up");

    await page.getByTestId("sign-up-username").fill(RESTAURANT_USERNAME);
    await page.getByTestId("sign-up-password").fill("s3cret-pass");
    await page.getByTestId("sign-up-email").fill("dupe@example.com");
    await page.getByTestId("sign-up-restaurant-name").fill("Dupe Diner");
    await page.getByTestId("sign-up-phone").fill("0900999999");
    await page.getByTestId("sign-up-address").fill("1 Dupe St");
    await page.getByTestId("sign-up-submit").click();

    await expect(page.getByTestId("sign-up-errors")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test("sign-in link navigates back to the sign-in page", async ({ page }) => {
    await page.goto("/management/sign-up");

    await page.getByTestId("sign-in-link").click();

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByTestId("sign-in-form")).toBeVisible();
  });
});

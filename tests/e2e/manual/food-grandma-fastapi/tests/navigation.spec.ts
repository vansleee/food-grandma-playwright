import { test, expect } from "./fixtures";

test.describe("Navigation & session", () => {
  test("redirects an unauthenticated visitor from /orders to /sign-in", async ({ page }) => {
    await page.goto("/management/orders");

    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("sidebar links move between dashboard pages", async ({ authedPage: page }) => {
    await page.goto("/management/orders");

    await page.getByTestId("nav-meals").click();
    await expect(page).toHaveURL(/\/meals$/);

    await page.getByTestId("nav-report").click();
    await expect(page).toHaveURL(/\/report$/);

    await page.getByTestId("nav-account").click();
    await expect(page).toHaveURL(/\/account$/);

    await page.getByTestId("nav-orders").click();
    await expect(page).toHaveURL(/\/orders$/);
  });

  test("sign out clears the session and redirects to sign-in", async ({ authedPage: page }) => {
    await page.goto("/management/orders");

    await page.getByTestId("nav-sign-out").click();

    // The sign-out link is a plain `<a href="#">`, so the URL keeps a
    // trailing "#" after the click handler navigates away.
    await expect(page).toHaveURL(/\/sign-in#?$/);

    // The token is gone, not just the current view — a manual /orders visit
    // must bounce back to sign-in rather than relying on client-side state.
    await page.goto("/management/orders");
    await expect(page).toHaveURL(/\/sign-in$/);
  });
});

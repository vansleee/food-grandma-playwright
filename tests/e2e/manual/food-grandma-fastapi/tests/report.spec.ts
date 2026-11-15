import { test, expect } from "./fixtures";

test.describe("Report", () => {
  test("renders revenue, orders, meals, and drivers charts", async ({ authedPage: page }) => {
    await page.goto("/management/report");

    await expect(page.getByTestId("revenue-chart")).toBeVisible();
    await expect(page.getByTestId("orders-chart")).toBeVisible();
    await expect(page.getByTestId("meals-chart")).toBeVisible();
    await expect(page.getByTestId("drivers-chart")).toBeVisible();

    // Recharts renders SVGs asynchronously once data loads — assert the
    // actual chart markup, not just the wrapping card.
    await expect(page.getByTestId("revenue-chart").locator("svg")).toBeVisible();
  });
});

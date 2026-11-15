import { expect, test, type Page, type APIRequestContext } from "@playwright/test";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MANAGEMENT_BASE_URL = "http://localhost:8082/management/";
const BACKEND_BASE_URL = "http://localhost:8081";
const RESET_KEY = process.env.DEMO_RESET_KEY || "local-dev-reset-key";
const RESET_LOCK_DIR = join(tmpdir(), "food-grandma-fastapi-e2e-reset.lock");
const RESET_LOCK_OWNER = join(RESET_LOCK_DIR, "owner");

type TestData = {
  username: string;
  password: string;
  cookingOrderId: number;
  meal: { id: number; name: string; price: number };
};

type SeedResponse = {
  status: string;
  restaurant_login?: { username?: string; password?: string };
  seeded_order_id?: number;
};

let testData: TestData | undefined;
let ownsResetLock = false;

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== "ESRCH";
  }
}

async function acquireResetLock(): Promise<void> {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    try {
      await fs.mkdir(RESET_LOCK_DIR);
      try {
        await fs.writeFile(RESET_LOCK_OWNER, `${process.pid}\n`, { flag: "wx" });
      } catch (error) {
        await fs.rmdir(RESET_LOCK_DIR).catch(() => undefined);
        throw error;
      }
      ownsResetLock = true;
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }

    let owner: string;
    try {
      owner = await fs.readFile(RESET_LOCK_OWNER, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }
      throw error;
    }

    const pid = Number(owner.trim());
    if (Number.isInteger(pid) && pid > 0 && !isProcessAlive(pid)) {
      await fs.unlink(RESET_LOCK_OWNER).catch(() => undefined);
      await fs.rmdir(RESET_LOCK_DIR).catch(() => undefined);
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("Timed out waiting for the exclusive Food Grandma E2E reset lock.");
}

async function releaseResetLock(): Promise<void> {
  if (!ownsResetLock) return;
  ownsResetLock = false;

  try {
    const owner = await fs.readFile(RESET_LOCK_OWNER, "utf8");
    if (Number(owner.trim()) === process.pid) {
      await fs.unlink(RESET_LOCK_OWNER);
      await fs.rmdir(RESET_LOCK_DIR);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function requireTestData(): TestData {
  if (!testData) throw new Error("Test data was not prepared before the UI test.");
  return testData;
}

async function signIn(page: Page, data: TestData): Promise<void> {
  await page.goto(`${MANAGEMENT_BASE_URL}sign-in`);
  await page.getByTestId("sign-in-username").fill(data.username);
  await page.getByTestId("sign-in-password").fill(data.password);
  await page.getByTestId("sign-in-submit").click();
  await expect(page).toHaveURL(`${MANAGEMENT_BASE_URL}orders`);
}

async function expectSuccessfulResponse(
  response: Awaited<ReturnType<APIRequestContext["post"]>>,
  operation: string,
): Promise<void> {
  expect(response.status(), `${operation} HTTP status`).toBe(200);
}

test.describe("Food Grandma React UI", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ request }) => {
    if (test.info().config.workers !== 1) {
      throw new Error("Run this database-resetting suite with exactly one Playwright worker.");
    }

    await acquireResetLock();
    testData = undefined;

    try {
      const resetResponse = await request.post(`${BACKEND_BASE_URL}/api/test/reset`, {
        headers: { "X-Demo-Reset-Key": RESET_KEY },
      });
      await expectSuccessfulResponse(resetResponse, "Demo reset");
      const resetBody = (await resetResponse.json()) as { status?: string };
      expect(resetBody.status, "Demo reset response body").toBe("reset");

      const seedResponse = await request.post(`${BACKEND_BASE_URL}/api/test/seed`, {
        headers: { "X-Demo-Reset-Key": RESET_KEY },
      });
      await expectSuccessfulResponse(seedResponse, "Demo seed");
      const seedBody = (await seedResponse.json()) as SeedResponse;
      expect(seedBody.status, "Demo seed response body").toBe("seeded");
      expect(seedBody.restaurant_login?.username, "Seeded restaurant username").toBeTruthy();
      expect(seedBody.restaurant_login?.password, "Seeded restaurant password").toBeTruthy();
      expect(seedBody.seeded_order_id, "Seeded Cooking order ID").toEqual(expect.any(Number));

      const username = seedBody.restaurant_login!.username!;
      const password = seedBody.restaurant_login!.password!;
      const loginResponse = await request.post(`${BACKEND_BASE_URL}/api/social/token/`, {
        form: { username, password },
      });
      expect(loginResponse.status(), "Restaurant token HTTP status").toBe(200);
      const loginBody = (await loginResponse.json()) as { access_token?: string };
      expect(loginBody.access_token, "Restaurant access token").toBeTruthy();
      const headers = { Authorization: `Bearer ${loginBody.access_token}` };

      const ordersResponse = await request.get(`${BACKEND_BASE_URL}/api/restaurant/orders/`, {
        headers,
      });
      expect(ordersResponse.status(), "Restaurant orders HTTP status").toBe(200);
      const ordersBody = (await ordersResponse.json()) as {
        orders?: Array<{ id: number; status: string }>;
      };
      expect(Array.isArray(ordersBody.orders), "Restaurant orders response body").toBe(true);
      const cookingOrder = ordersBody.orders!.find(
        (order) =>
          order.id === seedBody.seeded_order_id &&
          order.status.toLowerCase() === "cooking",
      );
      if (!cookingOrder) {
        throw new Error(
          "Insufficient test-data prerequisite: the restaurant API returned no seeded Cooking order.",
        );
      }

      const mealsResponse = await request.get(`${BACKEND_BASE_URL}/api/restaurant/meals/`, {
        headers,
      });
      expect(mealsResponse.status(), "Restaurant meals HTTP status").toBe(200);
      const mealsBody = (await mealsResponse.json()) as {
        meals?: Array<{ id: number; name: string; price: number }>;
      };
      expect(Array.isArray(mealsBody.meals), "Restaurant meals response body").toBe(true);
      const meal = mealsBody.meals?.[0];
      if (!meal) {
        throw new Error("Insufficient test-data prerequisite: the restaurant API returned no meals.");
      }

      testData = {
        username,
        password,
        cookingOrderId: cookingOrder.id,
        meal: { id: meal.id, name: meal.name, price: meal.price },
      };
    } catch (error) {
      await releaseResetLock();
      throw error;
    }
  });

  test.afterEach(async () => {
    await releaseResetLock();
  });

  test("signs in and shows the loaded orders", async ({ page }) => {
    // Arrange
    const data = requireTestData();
    await page.goto(`${MANAGEMENT_BASE_URL}sign-in`);
    await page.getByTestId("sign-in-username").fill(data.username);
    await page.getByTestId("sign-in-password").fill(data.password);

    // Act
    await page.getByTestId("sign-in-submit").click();

    // Assert
    await expect(page).toHaveURL(`${MANAGEMENT_BASE_URL}orders`);
    await expect(page.getByRole("heading", { name: "訂單管理", exact: true })).toBeVisible();
    await expect(page.getByTestId("order-row")).not.toHaveCount(0);
  });

  test("marks the saved Cooking order as ready for pickup", async ({ page }) => {
    // Arrange
    const data = requireTestData();
    await signIn(page, data);
    const row = page.locator(
      `[data-testid="order-row"][data-order-id="${data.cookingOrderId}"]`,
    );
    await expect(row).toBeVisible();
    const readyButton = row.getByRole("button", { name: "備餐完成 →", exact: true });
    await expect(readyButton).toBeVisible();

    // Act
    await readyButton.click();

    // Assert
    await expect(row.getByTestId("order-status")).toContainText("待取餐");
    await expect(readyButton).toHaveCount(0);
  });

  test("shows the saved meal's API name and price", async ({ page }) => {
    // Arrange
    const data = requireTestData();
    await signIn(page, data);

    // Act
    await page.getByTestId("nav-meals").click();

    // Assert
    await expect(page).toHaveURL(`${MANAGEMENT_BASE_URL}meals`);
    const row = page.locator(`[data-testid="meal-row"][data-meal-id="${data.meal.id}"]`);
    await expect(row).toBeVisible();
    await expect(row.getByText(data.meal.name, { exact: true })).toBeVisible();
    await expect(
      row.getByText(`$${data.meal.price.toLocaleString()}`, { exact: true }),
    ).toBeVisible();
  });
});

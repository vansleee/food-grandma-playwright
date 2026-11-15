
import { test, expect } from "../../04-meal-management/support/fixtures";

test.describe("CH44-04", () => {
  test("MEAL-T02 [MEAL-04] 從編輯頁將餐點價格由 120 改為 150", async ({
    signedInPage,
    restaurantMeals,
    mealsPage,
    mealFormPage,
  }) => {
    const ORIGINAL_PRICE = 120;
    const NEW_PRICE = 150;
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const input = {
      name: `MEAL-T02 價格測試 ${runId}`,
      short_description: `MEAL-T02 描述 ${runId}`,
      image: "",
      price: ORIGINAL_PRICE,
    };

    const created = await restaurantMeals.create(input);
    expect(created.id).toEqual(expect.any(Number));
    expect(created).toMatchObject(input);
    const idsBefore = await restaurantMeals.ids();
    expect(idsBefore).toContain(created.id);

    await mealsPage.goto();
    await mealsPage.expectRow(created, ORIGINAL_PRICE);

    await mealsPage.openEdit(created.id);
    await mealFormPage.expectEditPage(created.id);
    await mealFormPage.expectLoaded({
      name: created.name,
      description: created.short_description,
      price: ORIGINAL_PRICE,
    });

    await mealFormPage.setPrice(NEW_PRICE);
    // 練習條件：更新請求延後 1.5 秒，模擬慢速更新。
    await signedInPage.route(`**/api/restaurant/meals/${created.id}`, async (route) => {
      if (route.request().method() === "PUT") {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      await route.continue();
    });
    const responseReady = signedInPage.waitForResponse((response) =>
      response.request().method() === "PUT" &&
      new URL(response.url()).pathname === `/api/restaurant/meals/${created.id}`
    );
    await signedInPage.getByTestId("meal-submit").click();
    const response = await responseReady;
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).not.toBe("failed");
    expect(body.meal).toMatchObject({ id: created.id, price: NEW_PRICE });

    await mealFormPage.expectSavedAndReturnedToList();
    await mealsPage.expectRow(created, NEW_PRICE);

    const updated = await restaurantMeals.get(created.id);
    expect(updated).toEqual({ ...created, price: NEW_PRICE });
    const mealsAfter = await restaurantMeals.list();
    expect(mealsAfter.map((m) => m.id).sort((a, b) => a - b)).toEqual(
      [...idsBefore].sort((a, b) => a - b),
    );
    expect(mealsAfter.filter((m) => m.name === created.name)).toHaveLength(1);

    await mealFormPage.goto(created.id);
    await mealFormPage.expectEditPage(created.id);
    await mealFormPage.expectLoaded({
      name: created.name,
      description: created.short_description,
      price: NEW_PRICE,
    });
  });
});

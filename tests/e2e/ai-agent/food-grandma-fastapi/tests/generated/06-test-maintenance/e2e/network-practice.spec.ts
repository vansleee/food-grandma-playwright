import { test, expect } from "../../04-meal-management/support/fixtures";

for (const mode of ["http-500", "request-failed", "offline"] as const) {
  test(`NETWORK ${mode}: failed save preserves input and supports retry`, async ({
    signedInPage, restaurantMeals, mealFormPage,
  }) => {
    const input = {
      name: `NETWORK ${mode} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      short_description: "網路失敗練習",
      image: "",
      price: 120,
    };
    const created = await restaurantMeals.create(input);
    await mealFormPage.goto(created.id);
    await mealFormPage.expectLoaded({ name: input.name, description: input.short_description, price: 120 });
    await mealFormPage.setPrice(150);
    const target = `**/api/restaurant/meals/${created.id}`;
    if (mode === "offline") {
      await signedInPage.context().setOffline(true);
    } else {
      await signedInPage.route(target, async (route) => {
        if (route.request().method() !== "PUT") return route.continue();
        if (mode === "http-500") {
          await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ detail: "練習用伺服器錯誤" }) });
        } else {
          await route.abort("failed");
        }
      });
    }
    try {
      await signedInPage.getByTestId("meal-submit").click();
      await expect(signedInPage.getByRole("alert")).toHaveText("餐點儲存失敗，請稍後重試。");
      await mealFormPage.expectEditPage(created.id);
      await expect(signedInPage.getByTestId("meal-name")).toHaveValue(input.name);
      await expect(signedInPage.getByTestId("meal-description")).toHaveValue(input.short_description);
      await expect(signedInPage.getByTestId("meal-price")).toHaveValue("150");
      await expect(signedInPage.getByTestId("meal-submit")).toBeEnabled();
      expect(await restaurantMeals.get(created.id)).toEqual(created);
    } finally {
      await signedInPage.context().setOffline(false);
      await signedInPage.unroute(target);
    }
    const response = await mealFormPage.save(created.id);
    expect(response.status()).toBe(200);
    await mealFormPage.expectSavedAndReturnedToList();
    expect(await restaurantMeals.get(created.id)).toEqual({ ...created, price: 150 });
    await mealFormPage.goto(created.id);
    await mealFormPage.expectLoaded({ name: input.name, description: input.short_description, price: 150 });
  });
}

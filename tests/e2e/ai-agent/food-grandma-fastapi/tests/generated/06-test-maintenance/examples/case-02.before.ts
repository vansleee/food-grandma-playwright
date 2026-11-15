
import { test, expect } from "../../04-meal-management/support/fixtures";

test.describe("CH44-02", () => {
  test("CH42-01：從網頁修改指定餐點價格", async ({
    restaurantMeals,
    mealsPage,
    mealFormPage,
    signedInPage,
  }) => {
    const ORIGINAL_PRICE = 120;
    const NEW_PRICE = 150;
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const input = {
      name: `CH42-01 價格測試 ${runId}`,
      short_description: `CH42-01 描述 ${runId}`,
      image: "",
      price: ORIGINAL_PRICE,
    };

    const created = await restaurantMeals.create(input);
    expect(created.id).toEqual(expect.any(Number));
    expect(created).toMatchObject(input);
    const anotherMeal = await restaurantMeals.create({
      ...input,
      name: `CH42-01 另一筆餐點 ${runId}`,
      price: 80,
    });
    const idsBefore = await restaurantMeals.ids();
    expect(idsBefore).toContain(created.id);

    await mealsPage.goto();
    await mealsPage.expectRow(created, ORIGINAL_PRICE);

    await signedInPage.getByTestId("meal-edit-link").first().click();
    await mealFormPage.expectEditPage(created.id);
    await mealFormPage.expectLoaded({
      name: created.name,
      description: created.short_description,
      price: ORIGINAL_PRICE,
    });

    await mealFormPage.setPrice(NEW_PRICE);
    const response = await mealFormPage.save(created.id);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).not.toBe("failed");
    expect(body.meal).toMatchObject({ id: created.id, price: NEW_PRICE });

    await mealFormPage.expectSavedAndReturnedToList();
    await mealsPage.expectRow(created, NEW_PRICE);

    const updated = await restaurantMeals.get(created.id);
    expect(updated).toEqual({ ...created, price: NEW_PRICE });
    expect(await restaurantMeals.get(anotherMeal.id)).toEqual(anotherMeal);
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

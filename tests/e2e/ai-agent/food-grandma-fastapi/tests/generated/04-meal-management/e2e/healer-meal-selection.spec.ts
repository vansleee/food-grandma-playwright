// plan: tests/generated/04-meal-management/plan-meal-t02.md

import { test, expect } from "../support/fixtures";

test.describe("CH42-01：餐點價格測試", () => {
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

    // 1. 建立專用餐點：透過 API 建立價格 120 的餐點，再記錄列表編號集合
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

    // 2. 開啟餐點列表：依編號找到餐點，確認名稱、描述與價格 120
    await mealsPage.goto();
    await mealsPage.expectRow(created, ORIGINAL_PRICE);

    // 3. 開啟編輯頁：點擊餐點名稱，等待原有資料載入
    await mealsPage.openEdit(created.id);
    await mealFormPage.expectEditPage(created.id);
    await mealFormPage.expectLoaded({
      name: created.name,
      description: created.short_description,
      price: ORIGINAL_PRICE,
    });

    // 4. 修改並儲存：只改價格為 150，按下「儲存餐點」
    await mealFormPage.setPrice(NEW_PRICE);
    const response = await mealFormPage.save(created.id);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).not.toBe("failed");
    expect(body.meal).toMatchObject({ id: created.id, price: NEW_PRICE });

    // 5. 確認列表：返回列表後，同一筆餐點顯示價格 150，名稱與描述不變
    await mealFormPage.expectSavedAndReturnedToList();
    await mealsPage.expectRow(created, NEW_PRICE);

    // 6. 查詢儲存結果：原餐點只有價格改變，編號集合不變，專用名稱只有一筆
    const updated = await restaurantMeals.get(created.id);
    expect(updated).toEqual({ ...created, price: NEW_PRICE });
    expect(await restaurantMeals.get(anotherMeal.id)).toEqual(anotherMeal);
    const mealsAfter = await restaurantMeals.list();
    expect(mealsAfter.map((m) => m.id).sort((a, b) => a - b)).toEqual(
      [...idsBefore].sort((a, b) => a - b),
    );
    expect(mealsAfter.filter((m) => m.name === created.name)).toHaveLength(1);

    // 7. 重新開啟編輯頁：名稱與描述為原值，價格為 150
    await mealFormPage.goto(created.id);
    await mealFormPage.expectEditPage(created.id);
    await mealFormPage.expectLoaded({
      name: created.name,
      description: created.short_description,
      price: NEW_PRICE,
    });
  });
});

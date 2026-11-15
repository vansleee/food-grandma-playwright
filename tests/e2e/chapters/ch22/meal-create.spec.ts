import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { parse } from 'csv-parse/sync';
import type { Api } from '../support/api';
import { MealFormPage, MealsPage, openManagementAs } from '../support/pages';
import { expect, test } from '../support/test';

type MealInput = { name: string; description: string; price: number };

async function expectMealSaved(page: Page, api: Api, token: string, meal: MealInput) {
  await expect(page).toHaveURL(/\/management\/meals$/);
  const matches = (await api.listMeals(token)).filter((saved) => saved.name === meal.name);
  expect(matches).toHaveLength(1);
  const [saved] = matches;
  expect(saved).toMatchObject({ name: meal.name, short_description: meal.description, price: meal.price, image: '' });

  const meals = new MealsPage(page);
  const row = meals.row(saved.id);
  await expect(row).toContainText(meal.name);
  await expect(row).toContainText(meal.description);
  await expect(row).toContainText(`$${meal.price}`);

  await page.reload();
  await meals.waitUntilLoaded();
  await expect(row).toContainText(meal.name);
  await expect(row).toContainText(meal.description);
  await expect(row).toContainText(`$${meal.price}`);
}

test.describe('改寫前：逐一宣告新增餐點測試', () => {
  test('CH28-T03 [MEAL-T01] 新增香煎雞腿便當，價格為 120 元', async ({ page, api, restaurant }) => {
    // Arrange：準備餐點資料並開啟餐點管理頁面。
    const meal = { name: '香煎雞腿便當', description: '附白飯與三樣配菜', price: 120 };
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals');
    await meals.waitUntilLoaded();

    // Act：從網頁新增餐點。
    await meals.addLink().click();
    await expect(page).toHaveURL(/\/management\/meals\/add$/);
    await form.fill({ name: meal.name, description: meal.description, price: String(meal.price), image: '' });
    await form.submit().click();

    // Assert：確認餐點已儲存，重新整理後仍出現在列表。
    await expectMealSaved(page, api, restaurant.token, meal);
  });

  test('CH28-T04 [MEAL-T04] 新增試吃小菜，價格為 0 元', async ({ page, api, restaurant }) => {
    // Arrange：準備餐點資料並開啟餐點管理頁面。
    const meal = { name: '試吃小菜', description: '免費試吃', price: 0 };
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals');
    await meals.waitUntilLoaded();

    // Act：從網頁新增餐點。
    await meals.addLink().click();
    await expect(page).toHaveURL(/\/management\/meals\/add$/);
    await form.fill({ name: meal.name, description: meal.description, price: String(meal.price), image: '' });
    await form.submit().click();

    // Assert：確認餐點已儲存，重新整理後仍出現在列表。
    await expectMealSaved(page, api, restaurant.token, meal);
  });
});

type CsvMeal = {
  caseId: string;
  sourceCase: string;
  name: string;
  description: string;
  price: string;
};

const csv = readFileSync(join(__dirname, 'meal-cases.csv'), 'utf8');
const rows = parse<CsvMeal>(csv, { columns: true, bom: true, skip_empty_lines: true });

test.describe('改寫後：用 CSV 宣告新增餐點測試', () => {
  for (const row of rows) {
    const price = Number(row.price);
    if (!/^\d+$/.test(row.price) || !Number.isSafeInteger(price)) {
      throw new Error(`${row.caseId} 的價格必須是大於或等於 0 的整數：${row.price}`);
    }
    const meal = { name: row.name, description: row.description, price };

    test(`${row.caseId} [${row.sourceCase}] 新增${meal.name}，價格為 ${meal.price} 元`, async ({ page, api, restaurant }) => {
      // Arrange：使用本列餐點資料，開啟餐點管理頁面。
      const meals = new MealsPage(page);
      const form = new MealFormPage(page);
      await openManagementAs(page, restaurant.token, '/management/meals');
      await meals.waitUntilLoaded();

      // Act：從網頁新增餐點。
      await meals.addLink().click();
      await expect(page).toHaveURL(/\/management\/meals\/add$/);
      await form.fill({ name: meal.name, description: meal.description, price: String(meal.price), image: '' });
      await form.submit().click();

      // Assert：確認餐點已儲存，重新整理後仍出現在列表。
      await expectMealSaved(page, api, restaurant.token, meal);
    });
  }
});

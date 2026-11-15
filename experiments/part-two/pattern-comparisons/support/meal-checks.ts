import { expect, type Page, type TestInfo } from '@playwright/test';
import type { MealView } from '../baseline/tests/support/api';
import { MealFormPage, MealsPage } from '../baseline/tests/support/pages';

export type SaveResult = { status: number; body: unknown };

export function watchMealSave(page: Page, id: number): Promise<SaveResult> {
  return page.waitForResponse((response) =>
    response.request().method() === 'PUT' && response.url().endsWith(`/api/restaurant/meals/${id}`))
    .then(async (response) => ({ status: response.status(), body: await response.json() }));
}

export async function expectOriginal(form: MealFormPage, meal: MealView) {
  await expect(form.name()).toHaveValue(meal.name);
  await expect(form.description()).toHaveValue(meal.short_description);
  await expect(form.image()).toHaveValue(meal.image);
  await expect(form.price()).toHaveValue(String(meal.price));
}

export async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(name);
  await page.screenshot({ path });
  await info.attach(name, { path, contentType: 'image/png' });
}

// 每組 before／after 共用相同驗收檢查，讓程式結構的改變不會刪減驗收要求。
export async function verifyEditedMeal(input: {
  page: Page;
  info: TestInfo;
  original: MealView;
  idsBefore: number[];
  price: number;
  saved: SaveResult;
  readMeals: () => Promise<MealView[]>;
}) {
  const { page, info, original, idsBefore, price, saved, readMeals } = input;
  const expected = { ...original, price };
  expect(saved.status).toBe(200);
  expect(saved.body).toMatchObject({ meal: expected });
  await expect(page).toHaveURL(/\/management\/meals$/);
  const meals = new MealsPage(page);
  await meals.waitUntilLoaded();
  await expect(meals.row(original.id)).toContainText(`$${price}`);
  await capture(page, info, '02-list-after-save.png');

  const after = await readMeals();
  const idsAfter = after.map((meal) => meal.id).sort((a, b) => a - b);
  expect(idsAfter, '儲存前後的餐點編號應相同').toEqual(idsBefore);
  expect(after.find((meal) => meal.id === original.id)).toMatchObject(expected);
  expect(after.filter((meal) => meal.name === original.name)).toHaveLength(1);

  await meals.row(original.id).getByTestId('meal-edit-link').click();
  await expectOriginal(new MealFormPage(page), expected);
  await capture(page, info, '03-reopened.png');
  await info.attach('observation.json', {
    contentType: 'application/json',
    body: JSON.stringify({ caseId: info.title.split(' ')[0], original, expectedPrice: price,
      saved, idsBefore, idsAfter, readBack: after.find((meal) => meal.id === original.id),
      reopenedPrice: await new MealFormPage(page).price().inputValue() }, null, 2),
  });
}

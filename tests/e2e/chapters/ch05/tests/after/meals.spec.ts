import { expect } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';

test('修改原本那筆雞腿便當的價格', async ({ loggedInPage, meal }) => {
  // Arrange：使用 Fixture 準備好的登入頁面。
  await loggedInPage.getByRole('link', { name: /餐點管理/ }).click();
  const mealRow = loggedInPage.locator(`[data-testid="meal-row"][data-meal-id="${meal.id}"]`);
  await mealRow.getByRole('link', { name: meal.name, exact: true }).click();
  const price = loggedInPage.getByLabel('價格', { exact: true });
  await expect(price).toHaveValue('100');

  // Act：將價格改為 150 元並儲存。
  await price.fill('150');
  await loggedInPage.getByRole('button', { name: '儲存餐點', exact: true }).click();

  // Assert：確認清單上同一筆餐點的價格，再重新開啟編輯頁面核對。
  await expect(loggedInPage).toHaveURL(/\/management\/meals$/);
  await expect(mealRow.getByRole('cell', { name: '$150', exact: true })).toBeVisible();
  await mealRow.getByRole('link', { name: meal.name, exact: true }).click();
  await expect(price).toHaveValue('150');
});

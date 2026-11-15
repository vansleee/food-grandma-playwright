import { expect } from '@playwright/test';
import { accountsFor, testPassword } from '../../../support/env';
import { test } from '../../fixtures/data.fixture';

test('修改原本那筆雞腿便當的價格', async ({ page, meal }) => {
  // Arrange：先從登入頁登入，再開啟要測的畫面。
  await page.goto('/management/sign-in');
  await page.getByLabel('帳號', { exact: true }).fill(accountsFor('CH05').restaurantA);
  await page.getByLabel('密碼', { exact: true }).fill(testPassword());
  await page.getByRole('button', { name: '登入', exact: true }).click();
  await expect(page).toHaveURL(/\/management\/orders$/);
  await page.getByRole('link', { name: /餐點管理/ }).click();
  const mealRow = page.locator(`[data-testid="meal-row"][data-meal-id="${meal.id}"]`);
  await mealRow.getByRole('link', { name: meal.name, exact: true }).click();
  const price = page.getByLabel('價格', { exact: true });
  await expect(price).toHaveValue('100');

  // Act：將價格改為 150 元並儲存。
  await price.fill('150');
  await page.getByRole('button', { name: '儲存餐點', exact: true }).click();

  // Assert：確認清單上同一筆餐點的價格，再重新開啟編輯頁面核對。
  await expect(page).toHaveURL(/\/management\/meals$/);
  await expect(mealRow.getByRole('cell', { name: '$150', exact: true })).toBeVisible();
  await mealRow.getByRole('link', { name: meal.name, exact: true }).click();
  await expect(price).toHaveValue('150');
});

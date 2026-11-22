import { test, expect } from '@playwright/test';

const resetKey = process.env.DEMO_RESET_KEY ?? 'local-dev-reset-key';

test.beforeEach(async ({ request }) => {
  const headers = { 'X-Demo-Reset-Key': resetKey };
  const reset = await request.post(
    'http://localhost:8081/api/test/reset',
    { headers },
  );
  expect(reset.ok()).toBeTruthy();

  const seed = await request.post(
    'http://localhost:8081/api/test/seed',
    { headers },
  );
  expect(seed.ok()).toBeTruthy();
});

test('restaurant signs in and reaches orders', async ({ page }) => {
  // Arrange
  await page.goto('/management/sign-in');

  // Act
  await page.getByLabel('帳號', { exact: true }).fill('admin');
  await page.getByLabel('密碼').fill('password@321');
  await page.getByTestId('sign-in-submit').click();

  // Assert
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByRole('heading', { name: '訂單管理' })).toBeVisible();
  await expect(page.getByTestId('order-table')).toBeVisible();
});

test('restaurant marks a cooking order as ready', async ({ page }) => {
  // Arrange
  await page.goto('/management/sign-in');
  await page.getByLabel('帳號', { exact: true }).fill('admin');
  await page.getByLabel('密碼').fill('password@321');
  await page.getByTestId('sign-in-submit').click();

  const order = page.getByTestId('order-row').filter({
    hasText: 'Cathy Customer',
  });

  // Act
  await expect(order.getByTestId('order-status')).toContainText('備餐中');
  await order.getByTestId('order-ready-button').click();

  // Assert
  await expect(order.getByTestId('order-status')).toContainText('待取餐');
  await expect(order.getByTestId('order-ready-button')).toHaveCount(0);
});

test('restaurant opens the seeded meals list', async ({ page }) => {
  await page.goto('/management/sign-in');
  await page.getByLabel('帳號', { exact: true }).fill('admin');
  await page.getByLabel('密碼').fill('password@321');
  await page.getByTestId('sign-in-submit').click();

  await page.getByTestId('nav-meals').click();

  await expect(page).toHaveURL(/\/meals$/);
  await expect(page.getByTestId('meal-table')).toBeVisible();
  await expect(page.getByTestId('meal-row').filter({ hasText: 'Margherita' })).toContainText('Margherita');
});

test('restaurant sees an error with wrong password', async ({ page }) => {
  // Arrange
  await page.goto('/management/sign-in');

  // Act
  await page.getByLabel('帳號', { exact: true }).fill('admin');
  await page.getByLabel('密碼').fill('wrong-password');
  await page.getByTestId('sign-in-submit').click();

  // Assert
  await expect(page.getByTestId('sign-in-error')).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('restaurant opens add meal page from meals list', async ({ page }) => {
  await page.goto('/management/sign-in');
  await page.getByLabel('帳號', { exact: true }).fill('admin');
  await page.getByLabel('密碼').fill('password@321');
  await page.getByTestId('sign-in-submit').click();

  await page.getByTestId('nav-meals').click();
  await page.getByTestId('add-meal-link').click();

  await expect(page).toHaveURL(/\/meals\/add$/);
  await expect(page.getByTestId('meal-form')).toBeVisible();
});

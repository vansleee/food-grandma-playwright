import { expect, test } from '@playwright/test';

test('AAA：Food Grandma 首頁標題包含品牌名稱', async ({ page }) => {
  // Arrange：開啟 Food Grandma 首頁。
  await page.goto('/');

  // Act：讀取瀏覽器的頁面標題。
  const title = await page.title();

  // Assert：標題應包含 Food Grandma。
  expect(title).toContain('Food Grandma');
});

test('Given-When-Then：Food Grandma 首頁標題包含品牌名稱', async ({ page }) => {
  // Given：使用者造訪 Food Grandma。
  // When：開啟首頁並等它載入。
  await page.goto('/');

  // Then：標題應包含 Food Grandma。
  await expect(page).toHaveTitle(/Food Grandma/);
});

test('練習 2：點擊「瀏覽所有餐廳」後前往首頁的餐廳清單', async ({ page }) => {
  // Arrange：開啟 Food Grandma 首頁。
  await page.goto('/');

  // Act：點擊「瀏覽所有餐廳」。
  await page.getByRole('link', { name: /瀏覽所有餐廳/ }).click();

  // Assert：網址指向餐廳清單，畫面顯示「所有餐廳」。
  await expect(page).toHaveURL(/#restaurants$/);
  await expect(page.getByRole('heading', { name: '所有餐廳' })).toBeInViewport();
});

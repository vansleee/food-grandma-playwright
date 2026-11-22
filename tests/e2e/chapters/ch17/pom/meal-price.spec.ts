import type { Locator, Page } from '@playwright/test';
import { expectStoredMeal } from '../../support/meal-assertions';
import { openManagementAs } from '../../support/pages';
import { expect, test } from '../../support/test';

test.describe('未使用 POM', () => {
  test('CH20-T01 修改原餐點價格為 150', async ({ page, api, restaurant, subject }, info) => {
    // Arrange：準備餐點，開啟編輯頁面並確認原有資料。
    const { original, idsBefore } = subject;
    await openManagementAs(page, restaurant.token, '/management/meals');
    const row = page.locator(`[data-testid="meal-row"][data-meal-id="${original.id}"]`);
    await row.getByTestId('meal-edit-link').click();
    await expect(page.getByTestId('meal-name')).toHaveValue(original.name);
    await expect(page.getByTestId('meal-description')).toHaveValue(original.short_description);
    await expect(page.getByTestId('meal-price')).toHaveValue('100');

    // Act：從網頁修改價格並儲存。
    await page.getByTestId('meal-price').fill('150');
    await page.getByTestId('meal-submit').click();

    // Assert：原餐點更新、不重複新增，重新開啟後仍是新價格。
    await expect(page).toHaveURL(/\/management\/meals$/);
    await expect(row).toContainText('$150');
    await expectStoredMeal(api, restaurant.token, original, idsBefore, 150);
    await row.getByTestId('meal-edit-link').click();
    await expect(page.getByTestId('meal-price')).toHaveValue('150');
  });
});

test.describe('v1', () => {
  class MealsPage {
    constructor(private readonly page: Page) { }

    table() {
      return this.page.getByTestId('meal-table');
    }

    loadingMessage() {
      return this.page.getByText('正在載入菜單…');
    }

    row(id: number) {
      return this.page.locator(`[data-testid="meal-row"][data-meal-id="${id}"]`);
    }
  }

  class MealFormPage {
    constructor(private readonly page: Page) { }
    name() { return this.page.getByTestId('meal-name'); }
    description() { return this.page.getByTestId('meal-description'); }
    image() { return this.page.getByTestId('meal-image'); }
    price() { return this.page.getByTestId('meal-price'); }
    submit() { return this.page.getByTestId('meal-submit'); }
  }
  test('CH20-T01 修改原餐點價格為 150', async ({ page, api, restaurant, subject }, info) => {
    // Arrange：準備餐點，開啟編輯頁面並確認原有資料。
    const { original, idsBefore } = subject;
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals');
    await expect(meals.table()).toBeVisible();
    await expect(meals.loadingMessage()).toHaveCount(0);
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.name()).toHaveValue(original.name);
    await expect(form.description()).toHaveValue(original.short_description);
    await expect(form.price()).toHaveValue('100');

    // Act：從網頁修改價格並儲存。
    await form.price().fill('150');
    await form.submit().click();

    // Assert：原餐點更新、不重複新增，重新開啟後仍是新價格。
    await expect(page).toHaveURL(/\/management\/meals$/);
    await expect(meals.row(original.id)).toContainText('$150');
    await expectStoredMeal(api, restaurant.token, original, idsBefore, 150);
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.price()).toHaveValue('150');
  });
});

test.describe('v2', () => {
  class MealRow {
    constructor(readonly root: Locator) { }
    async openEditor() {
      await this.root.getByTestId('meal-edit-link').click();
    }
  }

  class MealsPage {
    readonly rows: Locator;
    constructor(private readonly page: Page) {
      this.rows = page.getByTestId('meal-row');
    }

    async goto() {
      await this.page.goto('/management/meals');
    }

    heading() {
      return this.page.getByRole('heading', { name: '餐點管理', level: 1 });
    }

    table() {
      return this.page.getByTestId('meal-table');
    }

    loadingMessage() {
      return this.page.getByText('正在載入菜單…');
    }

    meal(id: number) {
      return new MealRow(this.rows.and(this.page.locator(`[data-meal-id="${id}"]`)));
    }
  }

  class MealFormPage {
    readonly name: Locator;
    readonly description: Locator;
    readonly image: Locator;
    readonly price: Locator;
    readonly submit: Locator;

    constructor(private readonly page: Page) {
      this.name = page.getByLabel('餐點名稱');
      this.description = page.getByLabel('餐點描述');
      this.image = page.getByLabel('餐點圖片網址');
      this.price = page.getByLabel('價格');
      this.submit = page.getByTestId('meal-submit');
    }

    heading() {
      return this.page.getByRole('heading', { name: '編輯餐點', level: 1 });
    }

    async fill(draft: { name?: string; short_description?: string; image?: string; price?: string }) {
      if (draft.name !== undefined) await this.name.fill(draft.name);
      if (draft.short_description !== undefined) await this.description.fill(draft.short_description);
      if (draft.image !== undefined) await this.image.fill(draft.image);
      if (draft.price !== undefined) await this.price.fill(draft.price);
    }

    async save() {
      await this.submit.click();
    }
  }
  test('CH20-T01 修改原餐點價格為 150', async ({ page, api, restaurant, subject }, info) => {
    // Arrange：準備餐點，開啟編輯頁面並確認原有資料。
    const { original, idsBefore } = subject;
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals');
    await meals.goto();
    await expect(page).toHaveURL(/\/management\/meals$/);
    await expect(meals.heading()).toBeVisible();
    await expect(meals.table()).toBeVisible();
    await expect(meals.loadingMessage()).toBeHidden();
    await meals.meal(original.id).openEditor();
    await expect(form.heading()).toBeVisible();
    await expect(form.name).toHaveValue(original.name);
    await expect(form.description).toHaveValue(original.short_description);
    await expect(form.image).toHaveValue(original.image);
    await expect(form.price).toHaveValue(String(original.price));

    // Act：從網頁修改價格並儲存。
    await form.fill({ price: '150' });
    await form.save();

    // Assert：原餐點更新、不重複新增，重新開啟後仍是新價格。
    await expect(page).toHaveURL(/\/management\/meals$/);
    await expect(meals.meal(original.id).root).toContainText('$150');
    await expectStoredMeal(api, restaurant.token, original, idsBefore, 150);
    await meals.meal(original.id).openEditor();
    await expect(form.heading()).toBeVisible();
    await expect(form.name).toHaveValue(original.name);
    await expect(form.description).toHaveValue(original.short_description);
    await expect(form.image).toHaveValue(original.image);
    await expect(form.price).toHaveValue('150');
  });
});

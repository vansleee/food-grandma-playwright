import { expect, type Locator, type Page } from '@playwright/test';
import type { ApiMeal, MealDraft } from '../domain';

export class MealRow {
  constructor(readonly root: Locator) {}

  editLink() {
    return this.root.getByTestId('meal-edit-link');
  }

  async openEditor() {
    await this.editLink().click();
  }
}

export class MealsPage {
  readonly searchBox: Locator;
  readonly rows: Locator;
  readonly noMatchText: Locator;

  constructor(private readonly page: Page) {
    this.searchBox = page.getByRole('textbox', { name: '搜尋餐點' });
    this.rows = page.getByTestId('meal-row');
    this.noMatchText = page.getByText('沒有符合的餐點，試試其他關鍵字。');
  }

  async goto() {
    await this.page.goto('/management/meals');
    await this.waitUntilReady();
  }

  async waitUntilReady() {
    await expect(this.page).toHaveURL(/\/management\/meals$/);
    await expect(this.page.getByRole('heading', { name: '餐點管理', level: 1 })).toBeVisible();
    await expect(this.page.getByTestId('meal-table')).toBeVisible();
    await expect(this.page.getByText('正在載入菜單…')).toBeHidden();
  }

  meal(id: number): MealRow {
    return new MealRow(this.rows.and(this.page.locator(`[data-meal-id="${id}"]`)));
  }

  async openAddForm() {
    await this.page.getByTestId('add-meal-link').click();
  }

  async search(text: string) {
    await this.searchBox.fill(text);
  }
}

export class MealFormPage {
  readonly name: Locator;
  readonly description: Locator;
  readonly image: Locator;
  readonly price: Locator;
  readonly alert: Locator;
  /** 新增與編輯表單的提交鈕文字不同（新增餐點／儲存餐點），以 test id 取得同一個提交鈕。 */
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByLabel('餐點名稱');
    this.description = page.getByLabel('餐點描述');
    this.image = page.getByLabel('餐點圖片網址');
    this.price = page.getByLabel('價格');
    this.alert = page.getByRole('alert');
    this.submit = page.getByTestId('meal-submit');
  }

  async gotoAdd() {
    await this.page.goto('/management/meals/add');
    await this.waitUntilReadyForAdd();
  }

  async gotoEdit(id: number) {
    await this.page.goto(`/management/meals/${id}/edit`);
  }

  async waitUntilReadyForAdd() {
    await expect(this.page).toHaveURL(/\/management\/meals\/add$/);
    await expect(this.page.getByRole('heading', { name: '新增餐點', level: 1 })).toBeVisible();
    await expect(this.submit).toBeEnabled();
  }

  /** 編輯頁表單一開始是空的，必須等原有資料載入後才算就緒。 */
  async expectLoaded(meal: ApiMeal) {
    await expect(this.page.getByRole('heading', { name: '編輯餐點', level: 1 })).toBeVisible();
    await expect(this.name).toHaveValue(meal.name);
    await expect(this.description).toHaveValue(meal.short_description);
    await expect(this.image).toHaveValue(meal.image);
    await expect(this.price).toHaveValue(String(meal.price));
  }

  async fill(draft: Partial<Omit<MealDraft, 'price'>> & { price?: string }) {
    if (draft.name !== undefined) await this.name.fill(draft.name);
    if (draft.short_description !== undefined) await this.description.fill(draft.short_description);
    if (draft.image !== undefined) await this.image.fill(draft.image);
    if (draft.price !== undefined) await this.price.fill(draft.price);
  }

  async save() {
    await this.submit.click();
  }

  /** 瀏覽器原生驗證狀態（MEAL-02：名稱必填、價格為不小於 0 的整數）。 */
  validity(field: 'name' | 'price') {
    const input = field === 'name' ? this.name : this.price;
    return input.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      valueMissing: el.validity.valueMissing,
      rangeUnderflow: el.validity.rangeUnderflow,
      stepMismatch: el.validity.stepMismatch,
    }));
  }
}

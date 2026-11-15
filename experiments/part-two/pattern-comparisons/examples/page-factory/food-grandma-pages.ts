import type { Page } from '@playwright/test';
import { MealFormPage, MealsPage } from '../../baseline/tests/support/pages';

// 一個實例只使用目前測試的 Page，不在模組或 Singleton 中保存頁面。
export class FoodGrandmaPages {
  readonly meals: MealsPage;
  readonly mealForm: MealFormPage;

  constructor(page: Page) {
    this.meals = new MealsPage(page);
    this.mealForm = new MealFormPage(page);
  }
}

import { expect, type Page } from '@playwright/test';
import { MealFormPage, MealsPage, openManagementAs } from '../../baseline/tests/support/pages';

export type Task = (actor: Actor) => Promise<void>;
export type Question<T> = (actor: Actor) => Promise<T>;

export class Actor {
  constructor(readonly name: string, readonly page: Page) {}

  async attemptsTo(...tasks: Task[]) {
    for (const task of tasks) await task(this);
  }

  asks<T>(question: Question<T>): Promise<T> {
    return question(this);
  }
}

export const OpenMealEditor = (token: string, id: number): Task => async ({ page }) => {
  const meals = new MealsPage(page);
  await openManagementAs(page, token, '/management/meals');
  await meals.waitUntilLoaded();
  await meals.row(id).getByTestId('meal-edit-link').click();
  await expect(page).toHaveURL(new RegExp(`/management/meals/${id}/edit$`));
};

export const ChangeMealPrice = (price: number): Task => async ({ page }) => {
  const form = new MealFormPage(page);
  await form.price().fill(String(price));
  await form.submit().click();
  await expect(page).toHaveURL(/\/management\/meals$/);
};

export const MealDetails = (): Question<{
  name: string; short_description: string; image: string; price: string;
}> => async ({ page }) => {
  const form = new MealFormPage(page);
  const [name, short_description, image, price] = await Promise.all([
    form.name().inputValue(), form.description().inputValue(), form.image().inputValue(), form.price().inputValue(),
  ]);
  return { name, short_description, image, price };
};

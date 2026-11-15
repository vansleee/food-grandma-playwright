import { test as base, World, type Restaurant } from '../baseline/tests/support/fixtures';
import type { Api, MealInput } from '../baseline/tests/support/api';

export const test = base.extend<{ caseId: string; restaurant: Restaurant }>({
  caseId: async ({}, use, testInfo) => {
    const match = /^([A-Z]+-T\d{2})\b/.exec(testInfo.title);
    if (!match) throw new Error('The title must start with the comparison case ID');
    await use(match[1]);
  },
  restaurant: async ({ api, caseId }, use) => {
    await use(await new World(api, caseId).restaurant());
  },
});

export const scenarios = [
  { suffix: 'T01', price: 150 },
  { suffix: 'T02', price: 0 },
] as const;

export function mealInput(caseId: string): MealInput {
  return { name: `${caseId} meal`, short_description: `${caseId} original description`, image: '', price: 100 };
}

export async function arrangeMeal(api: Api, restaurant: Restaurant, caseId: string) {
  const original = await api.createMeal(restaurant.token, mealInput(caseId));
  const idsBefore = (await api.listMeals(restaurant.token)).map((meal) => meal.id).sort((a, b) => a - b);
  return { original, idsBefore };
}

export { expect } from '@playwright/test';

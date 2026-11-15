import { test as base, World, type Restaurant } from './base-fixtures';
import type { Api, MealInput, MealView } from './api';

export type PreparedMeal = { original: MealView; idsBefore: number[] };

export function mealInput(caseId: string, repeat = 0): MealInput {
  return { name: `${caseId} meal ${repeat + 1}`, short_description: `${caseId} original description`, image: '', price: 100 };
}

export async function arrangeMeal(api: Api, restaurant: Restaurant, caseId: string, repeat = 0): Promise<PreparedMeal> {
  const original = await api.createMeal(restaurant.token, mealInput(caseId, repeat));
  const idsBefore = (await api.listMeals(restaurant.token)).map((meal) => meal.id).sort((a, b) => a - b);
  return { original, idsBefore };
}

export const test = base.extend<{ caseId: string; restaurant: Restaurant; subject: PreparedMeal }>({
  caseId: async ({}, use, info) => {
    const match = /^CH\d{2}-T\d{2}\b/.exec(info.title);
    if (!match) throw new Error('測試標題必須以章節案例編號開頭');
    await use(match[0]);
  },
  restaurant: async ({ api, caseId }, use) => {
    await use(await new World(api, caseId).restaurant());
  },
  subject: async ({ api, restaurant, caseId }, use, info) => {
    await use(await arrangeMeal(api, restaurant, caseId, info.repeatEachIndex));
  },
});

export { expect } from '@playwright/test';
export { World } from './base-fixtures';

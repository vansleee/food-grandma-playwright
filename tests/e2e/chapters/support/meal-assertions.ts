import { expect } from '@playwright/test';
import type { Api, MealView } from './api';

export async function expectStoredMeal(api: Api, token: string, original: MealView, idsBefore: number[], price: number) {
  const meals = await api.listMeals(token);
  expect(meals.map((meal) => meal.id).sort((a, b) => a - b)).toEqual(idsBefore);
  expect(meals.find((meal) => meal.id === original.id)).toEqual({ ...original, price });
  expect(meals.filter((meal) => meal.name === original.name)).toHaveLength(1);
}

import { readFile } from 'node:fs/promises';
import { API_BASE_URL } from '../../baseline/tests/support/env';
import { World } from '../../baseline/tests/support/fixtures';
import type { MealView } from '../../baseline/tests/support/api';
import { labTest, expect } from './test-base';

export const test = labTest.extend({
  subject: async ({ api, request }, use) => {
    const file = process.env.LAB_SHARED_MEAL;
    if (!file) throw new Error('LAB_SHARED_MEAL is required');
    const meal: MealView = JSON.parse(await readFile(file, 'utf8'));
    const restaurant = await new World(api, 'PAR-SHARED').restaurant();

    // 反例：兩個案例各自重設原價，卻仍修改同一筆餐點。
    const response = await request.put(`${API_BASE_URL}/api/restaurant/meals/${meal.id}`, {
      headers: { Authorization: `Bearer ${restaurant.token}` },
      data: { name: meal.name, short_description: meal.short_description, image: meal.image, price: 100 },
    });
    expect(response.ok()).toBe(true);
    await use({ restaurant, meal: { ...meal, price: 100 } });
  },
});

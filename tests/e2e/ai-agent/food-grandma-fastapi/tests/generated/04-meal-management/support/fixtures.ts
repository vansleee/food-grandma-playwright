import { test as base, expect, type Page } from "@playwright/test";
import { RestaurantMeals } from "./restaurant-meals";
import { MealsPage } from "./meals-page";
import { MealFormPage } from "./meal-form-page";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8081";
// Public demo account (same as tests/login.spec.ts). No reset/seed is performed.
const LOGIN = { username: "admin", password: "password@321" };
// localStorage key used by food-grandma-management/src/auth.ts.
const TOKEN_KEY = "food_grandma_restaurant_token";

type Fixtures = {
  // Bearer token kept in memory only; never logged or written to disk.
  restaurantToken: string;
  restaurantMeals: RestaurantMeals;
  // A page already signed in as the restaurant (sign-in UI is covered by login.spec.ts).
  signedInPage: Page;
  mealsPage: MealsPage;
  mealFormPage: MealFormPage;
};

export const test = base.extend<Fixtures>({
  restaurantToken: async ({ playwright }, use) => {
    const anonymous = await playwright.request.newContext({ baseURL: API_BASE_URL });
    try {
      const resp = await anonymous.post("/api/social/token/", { form: LOGIN });
      expect(resp.status()).toBe(200);
      const token = (await resp.json()).access_token;
      expect(token).toBeTruthy();
      await use(token);
    } finally {
      await anonymous.dispose();
    }
  },

  restaurantMeals: async ({ playwright, restaurantToken }, use) => {
    const restaurant = await playwright.request.newContext({
      baseURL: API_BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${restaurantToken}` },
    });
    try {
      await use(new RestaurantMeals(restaurant));
    } finally {
      await restaurant.dispose();
    }
  },

  signedInPage: async ({ page, restaurantToken }, use) => {
    await page.addInitScript(
      ({ key, token }) => window.localStorage.setItem(key, token),
      { key: TOKEN_KEY, token: restaurantToken },
    );
    await use(page);
  },

  mealsPage: async ({ signedInPage }, use) => {
    await use(new MealsPage(signedInPage));
  },

  mealFormPage: async ({ signedInPage }, use) => {
    await use(new MealFormPage(signedInPage));
  },
});

export { expect };

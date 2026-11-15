import { test as base, expect, request as pwRequest } from '@playwright/test';
import { Api, MealInput, MealView, OrderView } from './api';
import { API_BASE_URL, CaseAccounts, Role, accountsFor } from './env';

export interface Restaurant {
  token: string;
  id: number;
  username: string;
}

/** A test world bound to one original case ID and its dedicated accounts. */
export class World {
  readonly accounts: CaseAccounts;
  private uniq = 0;

  constructor(
    readonly api: Api,
    readonly caseId: string,
  ) {
    this.accounts = accountsFor(caseId);
  }

  token(role: Role): Promise<string> {
    return this.api.login(this.accounts[role]);
  }

  async restaurant(role: 'restaurantA' | 'restaurantB' = 'restaurantA'): Promise<Restaurant> {
    const token = await this.token(role);
    const me = await this.api.restaurantMe(token);
    return { token, id: me.restaurant.id, username: this.accounts[role] };
  }

  meal(rest: Restaurant, input: MealInput): Promise<MealView> {
    return this.api.createMeal(rest.token, input);
  }

  /** Customer places an order through the real API; the order is found again by its unique address. */
  async order(
    rest: Restaurant,
    customer: 'customerA' | 'customerB',
    address: string,
    mealId: number,
  ): Promise<OrderView> {
    const customerToken = await this.token(customer);
    await this.api.placeOrder(customerToken, rest.id, address, [{ meal_id: mealId, quantity: 1 }]);
    const found = (await this.api.listOrders(rest.token)).filter((o) => o.address === address);
    expect(found, `exactly one order should exist for address "${address}"`).toHaveLength(1);
    return found[0];
  }

  async readOrder(rest: Restaurant, orderId: number): Promise<OrderView> {
    const found = (await this.api.listOrders(rest.token)).find((o) => o.id === orderId);
    expect(found, `order ${orderId} should be listed for its restaurant`).toBeTruthy();
    return found!;
  }

  /** Unique readable token for this case, safe for case-insensitive text search. */
  tag(label: string): string {
    this.uniq += 1;
    return `${label}${this.caseId.replace(/\W/g, '')}n${this.uniq}`;
  }
}

export const test = base.extend<{ api: Api }>({
  api: async ({}, use) => {
    const ctx = await pwRequest.newContext({ baseURL: API_BASE_URL });
    await use(new Api(ctx));
    await ctx.dispose();
  },
});

export { expect };

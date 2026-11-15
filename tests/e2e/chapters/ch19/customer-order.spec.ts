import type { BrowserContext, Page } from '@playwright/test';
import type { Api } from '../support/api';
import type { Restaurant } from '../support/base-fixtures';
import { openManagementAs, OrdersPage } from '../support/pages';
import { expect, test as base, World } from '../support/test';

type OrderInput = {
  restaurantName: string;
  mealId: number;
  mealName: string;
  address: string;
  total: number;
};

class RestaurantsPage {
  constructor(private readonly page: Page) {}

  async search(name: string) {
    await this.page.getByRole('textbox', { name: '搜尋餐廳或地址' }).fill(name);
  }

  async openRestaurant(name: string) {
    await this.page.getByTestId('restaurant-card')
      .filter({ has: this.page.getByRole('heading', { name, exact: true }) })
      .getByRole('link').click();
  }
}

class MenuPage {
  constructor(private readonly page: Page) {}

  async addMealToCart(name: string) {
    await this.page.getByTestId('meal-card')
      .filter({ has: this.page.getByText(name, { exact: true }) })
      .getByTestId('add-to-cart').click();
  }

  async viewCart() {
    await this.page.getByTestId('view-cart').click();
  }
}

class CartPage {
  constructor(private readonly page: Page) {}

  async goToCheckout() {
    await this.page.getByTestId('go-to-checkout').click();
  }
}

class CheckoutPage {
  constructor(private readonly page: Page) {}

  async fillAddress(address: string) {
    await this.page.getByTestId('checkout-address').fill(address);
  }

  async submitOrder() {
    await this.page.getByTestId('place-order').click();
    await this.page.waitForURL(/\/customer\/delivery$/);
  }
}

type ShopPages = {
  restaurants: RestaurantsPage;
  menu: MenuPage;
  cart: CartPage;
  checkout: CheckoutPage;
};

type CustomerWorkflows = {
  customerA: CustomerOrderingWorkflow;
  customerB: CustomerOrderingWorkflow;
};

const test = base.extend<{ order: OrderInput; shop: ShopPages; customerWorkflows: CustomerWorkflows }>({
  order: async ({ api, restaurant, caseId, page }, use) => {
    const profile = await api.restaurantMe(restaurant.token);
    const meal = await api.createMeal(restaurant.token, {
      name: '香煎雞腿便當', short_description: '附白飯與三樣配菜', image: '', price: 120,
    });
    const customerToken = await new World(api, caseId).token('customerA');
    await page.addInitScript((token) => {
      localStorage.setItem('food_alpaca_customer_token', token);
    }, customerToken);
    await use({
      restaurantName: profile.restaurant.name, mealId: meal.id, mealName: meal.name,
      address: `${caseId} 測試用配送地址`, total: meal.price,
    });
  },
  shop: async ({ page }, use) => {
    await use({
      restaurants: new RestaurantsPage(page), menu: new MenuPage(page),
      cart: new CartPage(page), checkout: new CheckoutPage(page),
    });
  },
  customerWorkflows: async ({ browser, baseURL, api, caseId }, use) => {
    const contexts: BrowserContext[] = [];
    const world = new World(api, caseId);

    async function prepareCustomer(role: 'customerA' | 'customerB') {
      const context = await browser.newContext({ baseURL });
      contexts.push(context);
      const token = await world.token(role);
      await context.addInitScript((value) => {
        localStorage.setItem('food_alpaca_customer_token', value);
      }, token);
      const customerPage = await context.newPage();
      await customerPage.goto('/customer/restaurants');
      return new CustomerOrderingWorkflow({
        restaurants: new RestaurantsPage(customerPage), menu: new MenuPage(customerPage),
        cart: new CartPage(customerPage), checkout: new CheckoutPage(customerPage),
      });
    }

    try {
      await use({ customerA: await prepareCustomer('customerA'), customerB: await prepareCustomer('customerB') });
    } finally {
      await Promise.all(contexts.map((context) => context.close()));
    }
  },
});

class CustomerOrderJourney {
  private readonly steps: Array<() => Promise<void>> = [];

  constructor(private readonly shop: ShopPages) {}

  private add(step: () => Promise<void>): this {
    this.steps.push(step);
    return this;
  }

  searchRestaurant(name: string) { return this.add(() => this.shop.restaurants.search(name)); }
  openRestaurant(name: string) { return this.add(() => this.shop.restaurants.openRestaurant(name)); }
  addMealToCart(name: string) { return this.add(() => this.shop.menu.addMealToCart(name)); }
  viewCart() { return this.add(() => this.shop.menu.viewCart()); }
  goToCheckout() { return this.add(() => this.shop.cart.goToCheckout()); }
  deliverTo(address: string) { return this.add(() => this.shop.checkout.fillAddress(address)); }
  submitOrder() { return this.add(() => this.shop.checkout.submitOrder()); }

  async run(): Promise<void> {
    for (const step of this.steps.splice(0)) {
      await step();
    }
  }
}

class CustomerOrderingWorkflow {
  constructor(private readonly shop: ShopPages) {}

  async placeOrder(order: OrderInput): Promise<void> {
    await this.shop.restaurants.search(order.restaurantName);
    await this.shop.restaurants.openRestaurant(order.restaurantName);
    await this.shop.menu.addMealToCart(order.mealName);
    await this.shop.menu.viewCart();
    await this.shop.cart.goToCheckout();
    await this.shop.checkout.fillAddress(order.address);
    await this.shop.checkout.submitOrder();
  }
}

async function expectOrderPlaced(page: Page, api: Api, restaurant: Restaurant, order: OrderInput) {
  await expect(page).toHaveURL(/\/customer\/delivery$/);
  const card = page.getByTestId('delivery-card');
  await expect(card).toContainText(order.restaurantName);
  await expect(card).toContainText(order.address);
  await expect(card).toContainText(`$${order.total.toFixed(2)}`);

  const orders = await api.listOrders(restaurant.token);
  expect(orders).toHaveLength(1);
  expect(orders[0]).toMatchObject({
    address: order.address, total: order.total, status: 'Cooking',
    restaurant: { id: restaurant.id },
    order_details: [{
      meal: { id: order.mealId, name: order.mealName, price: order.total },
      quantity: 1, sub_total: order.total,
    }],
  });
  await expect(card).toContainText(`訂單 #${orders[0].id}`);
}

test.describe('POM（未使用流程模式）', () => {
  test('CH25-T01 顧客搜尋餐廳、選擇餐點並完成訂單', async ({ page, api, restaurant, order, shop }) => {
    // Arrange：使用本次顧客與餐點，開啟餐廳列表；購物車為空。
    await page.goto('/customer/restaurants');

    // Act：逐步呼叫頁面物件，完成訂購。
    await shop.restaurants.search(order.restaurantName);
    await shop.restaurants.openRestaurant(order.restaurantName);
    await shop.menu.addMealToCart(order.mealName);
    await shop.menu.viewCart();
    await shop.cart.goToCheckout();
    await shop.checkout.fillAddress(order.address);
    await shop.checkout.submitOrder();

    // Assert：顯示正確訂單，餐點、數量與金額一致，且只新增一筆訂單。
    await expectOrderPlaced(page, api, restaurant, order);
  });
});

test.describe('流暢介面（Fluent Interface）', () => {
  test('CH25-T01 顧客搜尋餐廳、選擇餐點並完成訂單', async ({ page, api, restaurant, order, shop }) => {
    // Arrange：使用本次顧客與餐點，開啟餐廳列表；購物車為空。
    await page.goto('/customer/restaurants');
    const ordering = new CustomerOrderJourney(shop);

    // Act：先描述顧客行為，再由 run() 依序等待每個步驟完成。
    await ordering
      .searchRestaurant(order.restaurantName)
      .openRestaurant(order.restaurantName)
      .addMealToCart(order.mealName)
      .viewCart()
      .goToCheckout()
      .deliverTo(order.address)
      .submitOrder()
      .run();

    // Assert：顯示正確訂單，餐點、數量與金額一致，且只新增一筆訂單。
    await expectOrderPlaced(page, api, restaurant, order);
  });
});

test.describe('Workflow Facade', () => {
  test('CH25-T01 顧客搜尋餐廳、選擇餐點並完成訂單', async ({ page, api, restaurant, order, shop }) => {
    // Arrange：使用本次顧客與餐點，開啟餐廳列表；購物車為空。
    await page.goto('/customer/restaurants');
    const workflow = new CustomerOrderingWorkflow(shop);

    // Act：交給流程物件完成一筆訂單。
    await workflow.placeOrder(order);

    // Assert：顯示正確訂單，餐點、數量與金額一致，且只新增一筆訂單。
    await expectOrderPlaced(page, api, restaurant, order);
  });

  test('CH25-T02 餐廳管理者從兩筆訂單中搜尋指定配送地址', async ({ page, api, restaurant, order, customerWorkflows }) => {
    // Arrange：兩位顧客各透過網頁下一筆訂單，再開啟餐廳訂單列表。
    const orderA = { ...order, address: `${order.address} A` };
    const orderB = { ...order, address: `${order.address} B` };
    const { customerA: customerAWorkflow, customerB: customerBWorkflow } = customerWorkflows;
    await customerAWorkflow.placeOrder(orderA);
    await customerBWorkflow.placeOrder(orderB);

    const createdOrders = await api.listOrders(restaurant.token);
    expect(createdOrders).toHaveLength(2);
    const matchesA = createdOrders.filter((created) => created.address === orderA.address);
    const matchesB = createdOrders.filter((created) => created.address === orderB.address);
    expect(matchesA).toHaveLength(1);
    expect(matchesB).toHaveLength(1);
    const [createdOrderA] = matchesA;
    const [createdOrderB] = matchesB;
    expect(createdOrderA.customer.id).not.toBe(createdOrderB.customer.id);

    await openManagementAs(page, restaurant.token, '/management/orders');
    const ordersPage = new OrdersPage(page);
    await ordersPage.waitUntilLoaded();
    await ordersPage.expectRows([createdOrderA.id, createdOrderB.id]);

    // Act：搜尋第一筆訂單的完整配送地址。
    await ordersPage.search(orderA.address);

    // Assert：只顯示第一筆訂單，另一筆訂單不出現在搜尋結果中。
    await ordersPage.expectRows([createdOrderA.id]);
    await expect(ordersPage.row(createdOrderA.id)).toContainText(orderA.address);
    await expect(ordersPage.row(createdOrderB.id)).toHaveCount(0);
  });
});

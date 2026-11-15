import { expect, type Page } from '@playwright/test';
import { OrdersPage } from '../support/pages';

export class RestaurantsPage {
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

export class MenuPage {
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

export class CartPage {
  constructor(private readonly page: Page) {}

  async goToCheckout() {
    await this.page.getByTestId('go-to-checkout').click();
  }
}

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async fillAddress(address: string) {
    await this.page.getByTestId('checkout-address').fill(address);
  }

  async submitOrder() {
    await this.page.getByTestId('place-order').click();
    await this.page.waitForURL(/\/customer\/delivery$/);
  }
}

export class RestaurantOrdersPage {
  constructor(private readonly page: Page) {}
  async markReady(id: number) {
    await this.page.goto('/management/orders');
    const orders = new OrdersPage(this.page);
    await orders.waitUntilLoaded();
    await orders.readyButton(id).click();
    await expect(orders.statusOf(id)).toHaveText('待取餐');
  }
}

export class DriverDeliveryPage {
  constructor(private readonly page: Page) {}
  private activeOrder(id: number) {
    return this.page.getByTestId('active-delivery-card').filter({
      has: this.page.getByRole('heading', { name: `訂單 #${id}`, exact: true }),
    });
  }
  async expectActiveOrder(id: number) {
    await expect(this.activeOrder(id)).toBeVisible();
  }
  async confirmDelivered(id: number) {
    await this.activeOrder(id).getByTestId('complete-delivery').click();
    await expect(this.activeOrder(id)).toHaveCount(0);
    await expect(this.page.getByRole('status')).toContainText('配送已完成');
  }
}

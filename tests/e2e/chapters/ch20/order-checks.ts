import { expect, type TestInfo } from '@playwright/test';
import type { Api, OrderView } from '../support/api';
import { OrdersPage } from '../support/pages';
import type { OrderInput } from './customerworkflows';
import type { RolePages } from './fixtures';

export async function readOrder(api: Api, token: string, address: string): Promise<OrderView> {
  const orders = await api.listOrders(token);
  const matches = orders.filter((order) => order.address === address);
  expect(matches).toHaveLength(1);
  return matches[0];
}

export async function expectLifecycle(pages: RolePages, order: OrderInput, snapshots: OrderView[], info: TestInfo) {
  const [created, ready, onTheWay, delivered] = snapshots;
  expect(snapshots.map((value) => value.status)).toEqual(['Cooking', 'Ready', 'On the way', 'Delivered']);
  expect(snapshots.map((value) => value.id)).toEqual([created.id, created.id, created.id, created.id]);
  for (const value of snapshots) {
    expect(value).toMatchObject({ address: order.address, total: order.total,
      customer: { id: created.customer.id },
      order_details: [{ meal: { id: order.mealId, name: order.mealName, price: order.total }, quantity: 1, sub_total: order.total }],
    });
  }
  expect(created.driver).toBeNull();
  expect(ready.driver).toBeNull();
  expect(onTheWay.driver?.id).toBe(order.driverId);
  expect(delivered.driver?.id).toBe(order.driverId);
  await expect(pages.driver.getByTestId('active-delivery-card')).toHaveCount(0);
  await expect(pages.driver.getByTestId('no-active-delivery')).toBeVisible();
  await pages.manager.reload();
  const managerOrders = new OrdersPage(pages.manager);
  await managerOrders.waitUntilLoaded();
  await expect(managerOrders.statusOf(created.id)).toHaveText('已送達');
  await pages.customer.goto('/customer/delivery');
  const customerOrder = pages.customer.getByTestId('delivery-card');
  await expect(customerOrder).toContainText(`訂單 #${created.id}`);
  await expect(customerOrder.getByTestId('order-status')).toHaveText('Delivered');
  await expect(customerOrder).toContainText(order.address);
  await expect(customerOrder).toContainText(`$${order.total.toFixed(2)}`);
  await info.attach(`lifecycle-${created.id}.json`, { body: JSON.stringify({ snapshots, expected: order }), contentType: 'application/json' });
}

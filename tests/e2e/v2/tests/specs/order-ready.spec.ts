import { expect, test } from '../support/fixtures';
import { expectOrderStatus } from '../support/assertions';
import { failedBody, Gate, RequestStub, serverError } from '../support/network';
import { OrderMother } from '../support/order-mother';
import { OrdersPage } from '../support/pages/orders-page';

// 規格：specs/03-order-mark-ready.md（READY-02、READY-03、READY-06）。
const MARK_READY = '**/api/restaurant/orders/*';
const FAILURE_MESSAGE = '更新訂單失敗，請稍後重試。';

test.describe('備餐完成', () => {
  test.use({ session: 'restaurantA' });

  test('READY-T02 在 UI 完成備餐後顯示待取餐，重新載入仍為待取餐', async ({ page, stage }) => {
    const mother = await OrderMother.open(stage, 'READY-T02');
    const order = await mother.cooking('customerA', 'Alpha Road 101');
    const orders = new OrdersPage(page);
    const row = orders.order(order.id);
    await orders.goto();
    await expectOrderStatus(row, 'Cooking');

    await row.markReady();

    await expect(orders.notice(order.id)).toBeVisible();
    // 成功通知先於列表重新載入出現，必須等目標狀態，不能只看通知。
    await expectOrderStatus(row, 'Ready');
    await expect(row.readyButton()).toHaveCount(0);

    await page.reload();
    await orders.waitUntilReady();
    await expectOrderStatus(row, 'Ready');
    await expect(row.readyButton()).toHaveCount(0);
    await mother.expectStatus(order.id, 'Ready');
  });

  test('READY-T05 更新回應尚未完成時所有備餐完成按鈕停用且不重複送出', async ({ page, stage }) => {
    const mother = await OrderMother.open(stage, 'READY-T05');
    const first = await mother.cooking('customerA', 'Alpha Road 101');
    const second = await mother.cooking('customerB', 'Bravo Lane 202');
    const orders = new OrdersPage(page);
    const firstRow = orders.order(first.id);
    const secondRow = orders.order(second.id);
    const patch = await RequestStub.install(page, MARK_READY, 'PATCH');
    const hold = new Gate();
    await orders.goto();

    await test.step('送出更新但回應尚未完成', async () => {
      patch.respondWith({ kind: 'continue' }, hold);
      await firstRow.markReady();
      await expect.poll(() => patch.count).toBe(1);
    });

    await test.step('所有備餐完成按鈕停用；強制再點也不會多送請求', async () => {
      await expect(firstRow.readyButton()).toBeDisabled();
      await expect(secondRow.readyButton()).toBeDisabled();
      await firstRow.readyButton().click({ force: true });
      await secondRow.readyButton().click({ force: true });
    });

    await test.step('放行回應：只有第一筆被更新，總共只送出一次', async () => {
      hold.open();
      await expectOrderStatus(firstRow, 'Ready');
      await expect(secondRow.readyButton()).toBeEnabled();
      expect(patch.count).toBe(1);
      await mother.expectStatus(first.id, 'Ready');
      await mother.expectStatus(second.id, 'Cooking');
    });
  });

  test('READY-T06 更新失敗（HTTP 500 與 status:failed）顯示失敗且不樂觀改成待取餐', async ({ page, stage }) => {
    const mother = await OrderMother.open(stage, 'READY-T06');
    const order = await mother.cooking('customerA', 'Alpha Road 101');
    const orders = new OrdersPage(page);
    const row = orders.order(order.id);
    const patch = await RequestStub.install(page, MARK_READY, 'PATCH');

    const failures = [
      { title: 'HTTP 500', reply: serverError },
      { title: 'HTTP 200 + status:failed', reply: failedBody('Order not found') },
    ];
    for (const [index, failure] of failures.entries()) {
      await test.step(failure.title, async () => {
        // 每種失敗都從乾淨的頁面開始，避免殘留上一次的錯誤訊息。
        await orders.goto();
        await expectOrderStatus(row, 'Cooking');
        patch.respondWith(failure.reply);

        await row.markReady();

        await expect(orders.alert).toContainText(FAILURE_MESSAGE);
        await expect(orders.notice(order.id)).toBeHidden();
        await expectOrderStatus(row, 'Cooking');
        await expect(row.readyButton()).toBeVisible();
        expect(patch.count).toBe(index + 1);
        // Stub 沒有碰到後端，真實訂單仍是備餐中。
        await mother.expectStatus(order.id, 'Cooking');
      });
    }
  });
});

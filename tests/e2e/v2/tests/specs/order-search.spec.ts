import { expect, test } from '../support/fixtures';
import { expectOrdersShown, expectOrderStatus, expectStatusTabCounts } from '../support/assertions';
import { matchesOrderSearch, type ApiOrder } from '../support/domain';
import { Gate, RequestStub, serverError } from '../support/network';
import { OrderMother } from '../support/order-mother';
import { OrdersPage } from '../support/pages/orders-page';

// 規格：specs/02-order-search-filter.md（FIND-02～FIND-07）。
// 搜尋比對是前端過濾，所以資料一律由真實 API 合法流程建立，只有 FIND-T07／T08 控制 GET 訂單列表的時序。

const LIST_ORDERS = '**/api/restaurant/orders/';

test.describe('訂單搜尋與篩選', () => {
  test.use({ session: 'restaurantA' });

  test('FIND-T02 分別以 ID、姓名、地址片段搜尋（含大小寫與前後空白）', async ({ page, stage }) => {
    const mother = await OrderMother.open(stage, 'FIND-T02');
    const alpha = await mother.cooking('customerA', 'Alpha Road 101');
    const bravo = await mother.cooking('customerB', 'Bravo Lane 202');
    const all = [alpha, bravo];
    const orders = new OrdersPage(page);
    await orders.goto();

    // 地址片段取自後端實際回傳的地址第一個詞，不假設地址一定原樣保存。
    const addressFragment = (order: ApiOrder) => order.address.split(' ')[0];
    const queriesFor = (order: ApiOrder) => [
      { kind: 'ID', text: String(order.id) },
      { kind: '姓名', text: order.customer.name },
      { kind: '姓名（大寫）', text: order.customer.name.toUpperCase() },
      { kind: '姓名（小寫）', text: order.customer.name.toLowerCase() },
      { kind: '姓名（前後空白）', text: `  ${order.customer.name}  ` },
      { kind: '地址片段', text: addressFragment(order) },
      { kind: '地址片段（大寫）', text: addressFragment(order).toUpperCase() },
      { kind: '地址片段（小寫）', text: addressFragment(order).toLowerCase() },
      { kind: '地址片段（前後空白）', text: ` ${addressFragment(order)} ` },
    ];

    for (const target of all) {
      for (const query of queriesFor(target)) {
        await test.step(`訂單 ${target.id}：${query.kind}「${query.text}」`, async () => {
          // FIND-02 的比對規則只用來決定「哪些訂單應該出現」；目標訂單本身必定要在其中。
          const expected = all.filter((order) => matchesOrderSearch(order, query.text));
          expect(expected.map((order) => order.id)).toContain(target.id);

          await orders.search(query.text);
          await expectOrdersShown(orders, all, expected);
        });
      }
    }
  });

  test('FIND-T03 搜尋顧客後選待取餐，只顯示同時符合顧客與待取餐的列', async ({ page, stage }) => {
    const mother = await OrderMother.open(stage, 'FIND-T03');
    // 顧客 A：一筆已送達 + 一筆待取餐；顧客 B：一筆待取餐。
    const aDelivered = await mother.delivered('customerA', 'Alpha Road 101', 'driverA');
    const aReady = await mother.ready('customerA', 'Alpha Road 102');
    const bReady = await mother.ready('customerB', 'Bravo Lane 201');
    const all = [aDelivered, aReady, bReady];
    const customerName = aReady.customer.name;
    expect(customerName).not.toBe('');
    expect(matchesOrderSearch(bReady, customerName), '顧客 B 的訂單不應符合顧客 A 的姓名').toBe(false);
    const orders = new OrdersPage(page);
    await orders.goto();

    await test.step('先搜尋顧客 A：已送達與待取餐兩筆都在', async () => {
      await orders.search(customerName);
      await expectOrdersShown(orders, all, [aDelivered, aReady]);
    });

    await test.step('再選「待取餐」：只剩顧客 A 的待取餐訂單', async () => {
      await orders.chooseStatus('Ready');
      await expect(orders.statusTab('Ready')).toHaveAttribute('aria-pressed', 'true');
      await expectOrdersShown(orders, all, [aReady]);
      await expectOrderStatus(orders.order(aReady.id), 'Ready');
    });
  });

  test('FIND-T04 改搜尋條件時頁尾筆數更新，頁籤維持未搜尋前的各狀態總數', async ({ page, stage }) => {
    const mother = await OrderMother.open(stage, 'FIND-T04');
    const aDelivered = await mother.delivered('customerA', 'Alpha Road 101', 'driverA');
    const aReady = await mother.ready('customerA', 'Alpha Road 102');
    const bCooking = await mother.cooking('customerB', 'Bravo Lane 201');
    const all = [aDelivered, aReady, bCooking];
    expect(matchesOrderSearch(bCooking, aReady.customer.name)).toBe(false);
    expect(matchesOrderSearch(aReady, bCooking.customer.name)).toBe(false);
    const orders = new OrdersPage(page);
    await orders.goto();

    await test.step('未搜尋：頁尾與頁籤都是全部訂單', async () => {
      await expectOrdersShown(orders, all, all);
      await expectStatusTabCounts(orders, all);
    });

    await test.step('搜尋顧客 A：頁尾 2 筆，頁籤不變', async () => {
      await orders.search(aReady.customer.name);
      await expectOrdersShown(orders, all, [aDelivered, aReady]);
      await expectStatusTabCounts(orders, all);
    });

    await test.step('改搜尋顧客 B：頁尾 1 筆，頁籤不變', async () => {
      await orders.search(bCooking.customer.name);
      await expectOrdersShown(orders, all, [bCooking]);
      await expectStatusTabCounts(orders, all);
    });
  });

  test('FIND-T05 搜尋不存在的字串顯示無符合結果訊息', async ({ page, stage }) => {
    const mother = await OrderMother.open(stage, 'FIND-T05');
    const order = await mother.cooking('customerA', 'Alpha Road 101');
    const orders = new OrdersPage(page);
    await orders.goto();
    await expect(orders.order(order.id).root).toBeVisible();

    await orders.search('zzz-no-such-order-zzz');

    await expect(orders.allRows).toHaveCount(0);
    await expect(orders.noMatchText).toBeVisible();
    await expect(orders.noOrdersText).toBeHidden();
  });

  test('FIND-T06 沒有任何訂單的餐廳顯示尚無訂單而非搜尋無結果', async ({ page, stage }) => {
    expect(await (await stage.restaurant()).listOrders(), '此案例的餐廳必須沒有訂單').toHaveLength(0);
    const orders = new OrdersPage(page);

    await orders.goto();

    await expect(orders.noOrdersText).toBeVisible();
    await expect(orders.noMatchText).toBeHidden();
    await expect(orders.allRows).toHaveCount(0);
  });

  test('FIND-T07 首次回應延遲顯示載入中，回應失敗顯示錯誤而非空狀態', async ({ page, stage }) => {
    const mother = await OrderMother.open(stage, 'FIND-T07');
    const order = await mother.cooking('customerA', 'Alpha Road 101');
    const orders = new OrdersPage(page);
    const list = await RequestStub.install(page, LIST_ORDERS, 'GET');

    await test.step('首次回應延遲：顯示載入中，不顯示空狀態或錯誤', async () => {
      const hold = new Gate();
      list.respondWith({ kind: 'continue' }, hold);
      await page.goto('/management/orders');

      await expect(orders.loadingText).toBeVisible();
      await expect(orders.noOrdersText).toBeHidden();
      await expect(orders.noMatchText).toBeHidden();
      await expect(orders.alert).toBeHidden();

      hold.open();
      await orders.waitUntilReady();
      await expect(orders.order(order.id).root).toBeVisible();
    });

    await test.step('首次回應失敗：顯示錯誤，不顯示成功的空狀態', async () => {
      list.respondWith(serverError);
      await page.reload();

      await expect(orders.alert).toBeVisible();
      await expect(orders.loadingText).toBeHidden();
      await expect(orders.noOrdersText).toBeHidden();
      await expect(orders.noMatchText).toBeHidden();
      await expect(orders.allRows).toHaveCount(0);
    });
  });

  test('FIND-T08 固定篩選後重新整理會發出新請求並依原條件顯示新資料', async ({ page, stage }) => {
    const mother = await OrderMother.open(stage, 'FIND-T08');
    const order = await mother.cooking('customerA', 'Alpha Road 101');
    const customerName = order.customer.name;
    const orders = new OrdersPage(page);
    const list = await RequestStub.install(page, LIST_ORDERS, 'GET');
    await orders.goto();
    const requestsBeforeRefresh = list.count;
    expect(requestsBeforeRefresh).toBeGreaterThan(0);

    await test.step('固定條件：搜尋顧客並選「待取餐」，目前沒有符合的訂單', async () => {
      await orders.search(customerName);
      await orders.chooseStatus('Ready');
      await expect(orders.noMatchText).toBeVisible();
    });

    await test.step('後端資料改變（備餐完成），再按重新整理', async () => {
      await mother.restaurant.markReady(order.id);
      const hold = new Gate();
      list.respondWith({ kind: 'continue' }, hold);

      await orders.refresh();

      await expect.poll(() => list.count).toBeGreaterThan(requestsBeforeRefresh);
      await expect(orders.refreshButton).toBeDisabled();
      hold.open();
    });

    await test.step('完成後依原條件顯示新資料', async () => {
      await orders.waitUntilReady();
      await expect(orders.searchBox).toHaveValue(customerName);
      await expect(orders.statusTab('Ready')).toHaveAttribute('aria-pressed', 'true');
      await expect(orders.order(order.id).root).toBeVisible();
      await expectOrderStatus(orders.order(order.id), 'Ready');
    });
  });
});

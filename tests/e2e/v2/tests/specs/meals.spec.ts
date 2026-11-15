import { expect, test } from '../support/fixtures';
import { MealBuilder } from '../support/builders';
import { Gate, RequestStub, serverError } from '../support/network';
import { MealFormPage, MealsPage } from '../support/pages/meals-pages';

// 規格：specs/04-meal-management.md（MEAL-02～MEAL-07）。餐廳起始沒有任何餐點。
const CREATE_MEAL = '**/api/restaurant/meals/';

test.describe('餐點管理', () => {
  test.use({ session: 'restaurantA' });

  test('MEAL-T01 新增餐點（價格 120、圖片網址留空）後出現在列表，重新整理仍在', async ({ page, stage }) => {
    const restaurant = await stage.restaurant();
    const draft = new MealBuilder('MEAL-T01').priced(120).build();
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await meals.goto();

    await meals.openAddForm();
    await form.waitUntilReadyForAdd();
    await form.fill({ name: draft.name, short_description: draft.short_description, image: '', price: '120' });
    await form.save();

    await meals.waitUntilReady();
    const created = (await restaurant.listMeals()).filter((meal) => meal.name === draft.name);
    expect(created).toHaveLength(1);
    const [meal] = created;
    expect(meal).toMatchObject({ short_description: draft.short_description, image: '', price: 120 });

    const row = meals.meal(meal.id);
    await expect(row.root).toBeVisible();
    await expect(row.root).toContainText(`#${meal.id}`);
    await expect(row.root).toContainText(draft.name);
    await expect(row.root).toContainText(draft.short_description);
    await expect(row.root).toContainText('$120');

    await page.reload();
    await meals.waitUntilReady();
    await expect(row.root).toBeVisible();
    await expect(row.root).toContainText('$120');
  });

  test('MEAL-T02 編輯既有餐點價格為 150，同一個 ID 更新且不重複新增', async ({ page, stage }) => {
    const restaurant = await stage.restaurant();
    const original = await restaurant.createMeal(new MealBuilder('MEAL-T02').priced(100).build());
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await meals.goto();

    await meals.meal(original.id).openEditor();
    await expect(page).toHaveURL(new RegExp(`/management/meals/${original.id}/edit$`));
    await form.expectLoaded(original);

    await form.fill({ price: '150' });
    await form.save();

    await meals.waitUntilReady();
    await expect(meals.meal(original.id).root).toContainText('$150');
    const after = await restaurant.listMeals();
    expect(after, '不得新增另一筆餐點').toHaveLength(1);
    expect(after[0]).toMatchObject({
      id: original.id,
      name: original.name,
      short_description: original.short_description,
      price: 150,
    });
  });

  test('MEAL-T03 名稱留空、價格負數、價格小數時瀏覽器驗證不通過且不送出儲存請求', async ({ page, stage }) => {
    const restaurant = await stage.restaurant();
    const valid = new MealBuilder('MEAL-T03').build();
    const form = new MealFormPage(page);
    const create = await RequestStub.install(page, CREATE_MEAL, 'POST');

    const invalidInputs = [
      { title: '名稱留空', input: { name: '' }, field: 'name', flag: 'valueMissing' },
      { title: '價格為負數', input: { price: '-5' }, field: 'price', flag: 'rangeUnderflow' },
      { title: '價格為小數', input: { price: '12.5' }, field: 'price', flag: 'stepMismatch' },
    ] as const;

    for (const scenario of invalidInputs) {
      await test.step(scenario.title, async () => {
        await form.gotoAdd();
        await form.fill({
          name: valid.name,
          short_description: valid.short_description,
          price: String(valid.price),
        });
        await form.fill(scenario.input);

        await form.save();

        expect(await form.validity(scenario.field)).toMatchObject({ valid: false, [scenario.flag]: true });
        await expect(page).toHaveURL(/\/management\/meals\/add$/);
      });
    }

    expect(create.count, '驗證不通過時不得送出儲存請求').toBe(0);
    expect(await restaurant.listMeals(), '後端不得新增任何餐點').toHaveLength(0);
  });

  test('MEAL-T04 新增價格為 0 的餐點可以儲存，API 重新查詢仍為 0', async ({ page, stage }) => {
    const restaurant = await stage.restaurant();
    const draft = new MealBuilder('MEAL-T04').priced(0).build();
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await form.gotoAdd();

    await form.fill({ name: draft.name, short_description: draft.short_description, price: '0' });
    await form.save();

    await meals.waitUntilReady();
    const created = (await restaurant.listMeals()).filter((meal) => meal.name === draft.name);
    expect(created).toHaveLength(1);
    expect(created[0].price).toBe(0);
    await expect(meals.meal(created[0].id).root).toContainText('$0');
  });

  test('MEAL-T05 依名稱或描述搜尋（不分大小寫），無符合時顯示無結果提示', async ({ page, stage }) => {
    const restaurant = await stage.restaurant();
    const noodles = await restaurant.createMeal(
      new MealBuilder('MEAL-T05').named('Mango Noodles').described('Sweet Sauce').build(),
    );
    const salad = await restaurant.createMeal(
      new MealBuilder('MEAL-T05').named('Garlic Salad').described('Crisp Lettuce').build(),
    );
    const rice = await restaurant.createMeal(
      new MealBuilder('MEAL-T05').named('Plain Rice').described('Steamed').build(),
    );
    const all = [noodles, salad, rice];
    const meals = new MealsPage(page);
    await meals.goto();

    const searches = [
      { title: '名稱（小寫）', text: 'mango', hits: [noodles] },
      { title: '名稱（大寫）', text: 'MANGO', hits: [noodles] },
      { title: '名稱（混合大小寫）', text: 'gArLiC sAlAd', hits: [salad] },
      { title: '描述（小寫）', text: 'sweet sauce', hits: [noodles] },
      { title: '描述（大寫）', text: 'SWEET SAUCE', hits: [noodles] },
      { title: '描述（混合大小寫）', text: 'cRiSp', hits: [salad] },
    ];
    for (const search of searches) {
      await test.step(`${search.title}「${search.text}」`, async () => {
        await meals.search(search.text);
        for (const meal of all) {
          await expect(meals.meal(meal.id).root, meal.name).toHaveCount(search.hits.includes(meal) ? 1 : 0);
        }
        await expect(meals.noMatchText).toBeHidden();
      });
    }

    await test.step('沒有符合條件的餐點：顯示搜尋無結果提示', async () => {
      await meals.search('zzz-no-such-meal-zzz');
      await expect(meals.rows).toHaveCount(0);
      await expect(meals.noMatchText).toBeVisible();
    });
  });

  test('MEAL-T06 儲存延遲期間停用按鈕，HTTP 500 後留在表單保留輸入並可再次送出', async ({ page, stage }) => {
    const restaurant = await stage.restaurant();
    const draft = new MealBuilder('MEAL-T06').priced(120).build();
    const image = 'https://example.com/meal-t06.jpg';
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    const create = await RequestStub.install(page, CREATE_MEAL, 'POST');
    const hold = new Gate();
    await form.gotoAdd();
    await form.fill({ name: draft.name, short_description: draft.short_description, image, price: '120' });

    await test.step('儲存請求延遲：按鈕停用', async () => {
      create.respondWith(serverError, hold);
      await form.save();
      await expect.poll(() => create.count).toBe(1);
      await expect(form.submit).toBeDisabled();
    });

    await test.step('延遲後回傳 HTTP 500：留在表單、顯示失敗、保留輸入', async () => {
      hold.open();
      await expect(form.alert).toContainText('餐點儲存失敗，請稍後重試。');
      await expect(page).toHaveURL(/\/management\/meals\/add$/);
      await expect(form.name).toHaveValue(draft.name);
      await expect(form.description).toHaveValue(draft.short_description);
      await expect(form.image).toHaveValue(image);
      await expect(form.price).toHaveValue('120');
      await expect(form.submit).toBeEnabled();
      expect(await restaurant.listMeals(), '失敗的請求不得寫入餐點').toHaveLength(0);
    });

    await test.step('再次送出（交給真實後端）：儲存成功並回到列表', async () => {
      create.passThrough();
      await form.save();
      await meals.waitUntilReady();
      expect(create.count).toBe(2);
      const saved = await restaurant.listMeals();
      expect(saved).toHaveLength(1);
      expect(saved[0]).toMatchObject({ name: draft.name, price: 120 });
    });
  });

  test('MEAL-T08 編輯頁餐點資料載入失敗時顯示載入失敗提示而非空白新增表單', async ({ page, stage }) => {
    const restaurant = await stage.restaurant();
    const meal = await restaurant.createMeal(new MealBuilder('MEAL-T08').build());
    const form = new MealFormPage(page);
    const load = await RequestStub.install(page, `**/api/restaurant/meals/${meal.id}`, 'GET');
    load.respondWith(serverError);

    await form.gotoEdit(meal.id);

    await expect(form.alert).toContainText('無法載入餐點，請重新整理頁面。');
    expect(load.count).toBeGreaterThan(0);
    // 這不是一個正常的新增表單：沒有「新增餐點」標題與提交鈕。
    await expect(page.getByRole('heading', { name: '新增餐點' })).toHaveCount(0);
    await expect(form.submit).not.toHaveText('新增餐點');
    expect(await restaurant.getMeal(meal.id), '原餐點不得被改動').toEqual(meal);
  });
});

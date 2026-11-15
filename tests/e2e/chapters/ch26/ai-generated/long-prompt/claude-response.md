我已讀完 `with-repository.spec.ts`、`ApiMealsRepository`、`support/test.ts` 的 Fixture、`MealsPage` 和 `MealFormPage`，也看過 `accounts.json` 與 Playwright 設定。程式碼如下，還沒有執行過。

```ts
import { MealFormPage, MealsPage, openManagementAs } from '../../support/pages';
import { expect, test } from '../../support/test';
import { ApiMealsRepository } from './api-meals-repository';

test.describe('v2 使用 Repository', () => {
  test.describe.configure({ mode: 'parallel' });

  test('CH32-T01 修改原餐點價格', async ({ page, api, restaurant }) => {
    // Arrange：建立一筆 100 元的雞腿便當。
    const input = {
      name: '雞腿便當',
      short_description: '本次測試使用的餐點',
      image: '',
      price: 100,
    };
    const repository = new ApiMealsRepository(api, restaurant.token);
    const original = await repository.add(input);

    // Act：從網頁開啟同一筆餐點，把價格改為 150 元並儲存。
    await openManagementAs(page, restaurant.token, '/management/meals');
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await meals.waitUntilLoaded();
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.price()).toHaveValue('100');
    await form.price().fill('150');
    await form.submit().click();
    await expect(page).toHaveURL(/\/management\/meals$/);

    // Assert：依原編號查回餐點，確認只有價格改變。
    const updated = await repository.find(original.id);
    expect(updated).toMatchObject({
      ...original,
      price: 150,
    });
  });

  test('CH32-T02 修改原餐點價格為 180 元', async ({ page, api, restaurant }) => {
    // Arrange：建立一筆 100 元的雞腿便當。
    const input = {
      name: '雞腿便當',
      short_description: '本次測試使用的餐點',
      image: '',
      price: 100,
    };
    const repository = new ApiMealsRepository(api, restaurant.token);
    const original = await repository.add(input);

    // Act：從網頁開啟同一筆餐點，把價格改為 180 元並儲存。
    await openManagementAs(page, restaurant.token, '/management/meals');
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await meals.waitUntilLoaded();
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.price()).toHaveValue('100');
    await form.price().fill('180');
    await form.submit().click();
    await expect(page).toHaveURL(/\/management\/meals$/);

    // Assert：依原編號查回餐點，確認只有價格改變。
    const updated = await repository.find(original.id);
    expect(updated).toMatchObject({
      ...original,
      price: 180,
    });
  });
});
```

**為什麼這樣寫：**

- **各自的餐廳：** `restaurant` Fixture 會依測試標題開頭的案例編號，從 `data/accounts.json` 取帳號登入。兩支測試若都叫 `CH32-T01`，就會登入同一間餐廳。所以新增案例改用 `CH32-T02`，它在 `accounts.json` 有一組自己的帳號（`reader-ch32-t02-restauranta`）。
- **各自的餐點：** 每支測試都透過 `repository.add()` 建立自己的雞腿便當，編輯和查回都用自己的 `original.id`，不會碰到對方的資料。
- **同一個檔案用兩個 worker：** 共用設定 `chapters/playwright.config.ts` 是 `workers: 1`、`fullyParallel: false`。所以同一個檔案裡的測試，就算加上 `--workers=2` 也還是會依序執行。我在 describe 裡加了 `test.describe.configure({ mode: 'parallel' })`，這樣用 `--workers=2` 時兩支測試會分到兩個 worker 同時跑。只用一個 worker 時則照順序跑，結果不變。
- **只用第 25 章的程式：** 只用到第 25 章的 `ApiMealsRepository` 和 `support/` 的共用程式，沒有引用第 26 章的完成範例。

**需要注意：**

- **編號已被使用：** `CH32-T02` 在 `ch25/meal-price.spec.ts` 也被拿來測「建立後可以依編號查詢餐點」。那些測試同樣只建立餐點、再依編號查回，所以和這支不會互相干擾。只是報告裡同一個編號會對應到兩種情境。如果要換成全新的編號，必須先在 `accounts.json` 和後端都建立對應的帳號。
- **建議的執行指令：** 請在 `tests/e2e/chapters` 目錄下執行 `npx playwright test -c examples/ch25/playwright.config.ts with-repository.spec.ts --workers=1`，再把參數換成 `--workers=2` 跑一次。

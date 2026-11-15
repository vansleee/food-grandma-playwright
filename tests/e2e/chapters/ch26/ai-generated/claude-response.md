I don't have a file-editing tool in this session, so I haven't changed the file on disk. Below is the full replacement for `tests/e2e/chapters/examples/ch25/with-repository.spec.ts`:

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

**How it meets the two requirements**

- **Each test has its own restaurant.** The `restaurant` fixture picks the login account from the case ID in the test title (`support/test.ts` → `accountsFor(caseId)`). The new test is titled `CH32-T02`, which already has its own accounts in `data/accounts.json`, so it uses a different restaurant from `CH32-T01`. Each test also creates its own 雞腿便當 and works only with that meal's ID.
- **It runs with 1 or 2 workers.** The chapters base config sets `fullyParallel: false`, which would keep both tests on one worker. `test.describe.configure({ mode: 'parallel' })` lets `--workers=2` run them at the same time. With `--workers=1` they run one after the other. `ch26/parallel-meals.spec.ts` does the same thing.

The 150 case is unchanged apart from the new `configure` line above it. The 180 case uses the same steps and the same `toMatchObject({ ...original, price })` check.

I haven't run either test. The `CH32-T02` accounts are also used by `chapters/ch25/meal-price.spec.ts`, so don't run that spec at the same time as this file.

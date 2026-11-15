import { test, expect, repositoryKind } from './fixtures';
import { prepareMealForEditing } from '../meals-repository';

test('RCON-T01 共用資料準備程式建立餐點後，可以依原編號查詢', async ({ repository }, testInfo) => {
  const input = { name: 'Contract meal', short_description: 'Original description', image: '', price: 100 };
  const { original, idsBefore } = await prepareMealForEditing(repository, input);
  expect(original.id).toBeGreaterThan(0);
  expect(original).toMatchObject(input);
  expect(idsBefore).toEqual([original.id]);
  expect(await repository.find(original.id)).toEqual(original);
  await testInfo.attach('observation.json', { contentType: 'application/json',
    body: JSON.stringify({ implementation: repositoryKind, original, idsBefore }) });
});

test('RCON-T02 更新原餐點價格，其他欄位與另一筆餐點保持不變', async ({ repository }, testInfo) => {
  const first = await repository.add({ name: 'First meal', short_description: 'First description', price: 100 });
  const second = await repository.add({ name: 'Second meal', short_description: 'Second description', price: 80 });
  const before = (await repository.all()).map((meal) => meal.id).sort((a, b) => a - b);
  const updated = await repository.changePrice(first.id, 150);
  expect(updated).toEqual({ ...first, price: 150 });
  expect(await repository.find(first.id)).toEqual({ ...first, price: 150 });
  expect(await repository.find(second.id)).toEqual(second);
  const after = (await repository.all()).map((meal) => meal.id).sort((a, b) => a - b);
  expect(after).toEqual(before);
  await testInfo.attach('observation.json', { contentType: 'application/json',
    body: JSON.stringify({ implementation: repositoryKind, first, second, updated, before, after }) });
});

test('RCON-T03 找不到的餐點回傳 undefined，更新時不新增資料', async ({ repository }, testInfo) => {
  expect(await repository.find(999999)).toBeUndefined();
  expect(await repository.changePrice(999999, 150)).toBeUndefined();
  expect(await repository.all()).toEqual([]);
  await testInfo.attach('observation.json', { contentType: 'application/json',
    body: JSON.stringify({ implementation: repositoryKind, missingId: 999999, meals: await repository.all() }) });
});

test('RCON-T04 修改取得的物件不會直接改動已儲存的資料', async ({ repository }, testInfo) => {
  const input = { name: 'Stored meal', short_description: 'Keep this description', image: '', price: 100 };
  const created = await repository.add(input);
  created.name = 'Changed only in the caller';
  expect(await repository.find(created.id)).toMatchObject(input);
  const list = await repository.all();
  list[0].price = 999;
  const stored = await repository.find(created.id);
  expect(stored).toMatchObject(input);
  await testInfo.attach('observation.json', { contentType: 'application/json',
    body: JSON.stringify({ implementation: repositoryKind, mutatedReturnedMeal: created, mutatedList: list, stored }) });
});

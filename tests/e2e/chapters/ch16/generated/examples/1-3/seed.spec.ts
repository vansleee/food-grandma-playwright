import { test } from '../../fixtures/demo';

test('seed', async ({ page, demo }) => {
  await page.goto('/management/sign-in');
});

import { test } from '../../support/ch15-16-comparison';

test('seed', async ({ page, demo }) => {
  await page.goto('/management/sign-in');
});

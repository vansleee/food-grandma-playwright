import { apiURL, test } from './demo-fixture';

test('seed', async ({ page, demo }) => {
  await page.goto("/management/sign-in");
});

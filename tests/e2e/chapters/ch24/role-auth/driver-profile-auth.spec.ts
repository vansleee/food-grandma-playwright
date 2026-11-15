import { expect, test } from '../../../v2/tests/support/fixtures';
import { AccessTokenAuth, BearerAuth, RoleApiClient } from '../../../v2/tests/support/api/role-client';
import { DriverRepository } from '../../../v2/tests/support/api/repositories';
import { apiBaseUrl } from '../../../v2/tests/support/env';

test('ROLE-T01 兩種認證方式查到指定外送員', async ({ playwright, stage }) => {
  // Arrange：共用 driverA 的 token。共用測試資料中，ROLE-T01 的 driverA 編號為 7。
  const expectedDriverId = 7;
  const token = await stage.token('driverA');
  const request = await playwright.request.newContext({ baseURL: apiBaseUrl() });
  try {
    const withQuery = new DriverRepository(
      new RoleApiClient(request, new AccessTokenAuth(token)),
    );
    const withBearer = new DriverRepository(
      new RoleApiClient(request, new BearerAuth(token)),
    );

    // Act：用兩種認證方式查詢同一位外送員。
    const queryProfile = await withQuery.profile();
    const bearerProfile = await withBearer.profile();

    // Assert：兩次查詢都回傳指定外送員的編號。
    expect(queryProfile.id, '查詢參數認證').toBe(expectedDriverId);
    expect(bearerProfile.id, 'Bearer 認證').toBe(expectedDriverId);
  } finally {
    await request.dispose();
  }
});

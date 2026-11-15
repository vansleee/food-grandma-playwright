import { test as base, expect } from '@playwright/test';
import { Stage } from './api/stage';
import { TOKEN_KEYS } from './domain';
import { accountsFor, apiBaseUrl } from './env';

/**
 * 預先帶入的登入狀態。管理站與外送員頁面都把 token 放在 localStorage，
 * 顧客／外送員沒有登入 UI，所以 Given「已登入」以真實 token 預載；
 * 要驗證登入或登出的案例（AUTH-T01／T03）仍走真實 UI。
 */
export type Session = 'none' | 'restaurantA' | 'driverA' | 'driverB';

type Fixtures = {
  /** 從測試標題開頭取出的案例 ID，例如 MEAL-T03。 */
  caseId: string;
  stage: Stage;
};

type Options = { session: Session };

export const test = base.extend<Fixtures & Options>({
  session: ['none', { option: true }],

  caseId: async ({}, use, testInfo) => {
    const match = /^([A-Z]+-T\d{2})\b/.exec(testInfo.title);
    if (!match) throw new Error(`測試標題必須以案例 ID 開頭：${testInfo.title}`);
    await use(match[1]);
  },

  // test scope：每個測試獨立登入、獨立使用自己案例的帳號；結束時釋放 request context。
  stage: async ({ playwright, caseId }, use) => {
    const request = await playwright.request.newContext({ baseURL: apiBaseUrl() });
    await use(new Stage(request, accountsFor(caseId)));
    await request.dispose();
  },

  // 覆寫內建 storageState，讓內建 page／context（含 trace、截圖）直接帶著登入狀態。
  storageState: async ({ session, stage, baseURL }, use) => {
    if (session === 'none') {
      await use(undefined);
      return;
    }
    const tokenKey = session.startsWith('restaurant') ? TOKEN_KEYS.restaurant : TOKEN_KEYS.driver;
    const value = await stage.token(session);
    await use({
      cookies: [],
      origins: [{ origin: new URL(baseURL!).origin, localStorage: [{ name: tokenKey, value }] }],
    });
  },
});

export { expect };

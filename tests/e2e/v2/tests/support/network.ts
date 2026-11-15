import type { Page, Route } from '@playwright/test';

/** 手動開關：讓被攔截的請求停在「回應尚未完成」的狀態，直到測試放行。 */
export class Gate {
  private release!: () => void;
  readonly opened = new Promise<void>((resolve) => (this.release = resolve));
  open() {
    this.release();
  }
}

export type Reply =
  | { kind: 'continue' } // 交給真實後端
  | { kind: 'fulfill'; status: number; json: unknown }; // Stub 回應

export const serverError: Reply = {
  kind: 'fulfill',
  status: 500,
  json: { detail: 'Internal Server Error' },
};

/** 後端對業務失敗常回 HTTP 200 + {status:'failed'}，前端也把它當成失敗。 */
export const failedBody = (error: string): Reply => ({
  kind: 'fulfill',
  status: 200,
  json: { status: 'failed', error },
});

type Rule = { reply: Reply; hold?: Gate };

/**
 * Ch33 Stub + Spy：只攔截指定 method 與 URL 的瀏覽器請求。
 * - Spy：`count` 記錄被攔截的請求數。
 * - Stub：`respondWith()` 設定的規則對之後每一個符合的請求持續生效，直到下次設定；
 *   預設交給真實後端。規則是持續生效而非「只用一次」，
 *   因為開發模式的 React StrictMode 會讓載入型 GET 重複送出，不應影響測試結果。
 * 被攔截的請求只影響畫面反應；資料是否真的寫入仍以真實 API 回讀。
 */
export class RequestStub {
  private rule: Rule = { reply: { kind: 'continue' } };
  private seen = 0;

  private constructor() {}

  static async install(page: Page, url: string | RegExp, method: string): Promise<RequestStub> {
    const stub = new RequestStub();
    await page.route(url, (route) => stub.handle(route, method));
    return stub;
  }

  get count() {
    return this.seen;
  }

  /** 之後的請求：有 hold 時，先等到 gate.open() 才送出 reply。 */
  respondWith(reply: Reply, hold?: Gate): this {
    this.rule = { reply, hold };
    return this;
  }

  passThrough(): this {
    return this.respondWith({ kind: 'continue' });
  }

  private async handle(route: Route, method: string) {
    if (route.request().method() !== method) {
      await route.fallback();
      return;
    }
    this.seen += 1;
    const { reply, hold } = this.rule;
    if (hold) await hold.opened;
    if (reply.kind === 'continue') await route.continue();
    else await route.fulfill({ status: reply.status, json: reply.json });
  }
}

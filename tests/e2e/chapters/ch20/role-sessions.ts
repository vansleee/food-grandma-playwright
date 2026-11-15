import type { Browser, BrowserContext, BrowserContextOptions, Page, TestInfo } from '@playwright/test';

export class RoleSessions {
  private readonly contexts: BrowserContext[] = [];
  private readonly pages = new Map<string, Page>();

  constructor(private readonly browser: Browser, private readonly options: BrowserContextOptions) {}

  async open(role: string, key: string, token: string): Promise<Page> {
    const context = await this.browser.newContext(this.options);
    this.contexts.push(context);
    await context.addInitScript(({ key, token }) => localStorage.setItem(key, token), { key, token });
    const page = await context.newPage();
    this.pages.set(role, page);
    return page;
  }

  async dispose(info: Pick<TestInfo, 'attach' | 'annotations' | 'status'>): Promise<void> {
    try {
      const evidence = await Promise.allSettled([...this.pages].map(async ([role, page]) => {
        if (!page.isClosed() && page.url() !== 'about:blank') {
          await info.attach(`${role}-final`, { body: await page.screenshot({ timeout: 2_000 }), contentType: 'image/png' });
        }
      }));
      for (const result of evidence) {
        if (result.status === 'rejected') info.annotations.push({ type: 'evidence-error', description: String(result.reason) });
      }
    } finally {
      const closed = await Promise.allSettled(this.contexts.map((context) => context.close()));
      const errors = closed.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
      this.contexts.length = 0;
      this.pages.clear();
      if (errors.length) {
        const failure = new AggregateError(errors.map((result) => result.reason), '無法關閉部分角色瀏覽器環境');
        if (info.status === 'failed' || info.status === 'timedOut' || info.status === 'interrupted') {
          info.annotations.push({ type: 'cleanup-error', description: String(failure) });
        } else {
          throw failure;
        }
      }
    }
  }
}

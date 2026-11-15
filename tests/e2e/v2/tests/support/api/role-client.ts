import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

/**
 * Ch31 Strategy：同樣是「帶著 token 呼叫 API」，店家用 Bearer header，
 * 顧客與外送員用 access_token（GET 放 query、POST/PUT/PATCH 放 form）。
 */
export interface AuthStrategy {
  headers(): Record<string, string>;
  query(): Record<string, string>;
  form(): Record<string, string>;
}

export class BearerAuth implements AuthStrategy {
  constructor(private readonly token: string) {}
  headers() {
    return { Authorization: `Bearer ${this.token}` };
  }
  query() {
    return {};
  }
  form() {
    return {};
  }
}

export class AccessTokenAuth implements AuthStrategy {
  constructor(private readonly token: string) {}
  headers() {
    return {};
  }
  query() {
    return { access_token: this.token };
  }
  form() {
    return { access_token: this.token };
  }
}

export class RoleApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly auth: AuthStrategy,
  ) {}

  get(path: string) {
    return this.request.get(path, { headers: this.auth.headers(), params: this.auth.query() });
  }

  json(method: 'POST' | 'PUT' | 'PATCH', path: string, data?: unknown) {
    return this.request.fetch(path, { method, headers: this.auth.headers(), data });
  }

  form(method: 'POST' | 'PUT' | 'PATCH', path: string, fields: Record<string, string> = {}) {
    return this.request.fetch(path, {
      method,
      headers: this.auth.headers(),
      form: { ...this.auth.form(), ...fields },
    });
  }
}

/**
 * 後端對「找不到」「失敗」常回 HTTP 200 + {status:'failed'}（README 第 7 點），
 * 所以必須同時檢查 HTTP 狀態與 body。
 */
export async function readJson<T>(response: APIResponse, what: string): Promise<T> {
  expect(response.ok(), `${what}：HTTP ${response.status()}`).toBe(true);
  const body = await response.json();
  expect(body?.status, `${what}：回應 ${JSON.stringify(body)}`).not.toBe('failed');
  return body as T;
}

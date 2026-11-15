import * as fs from 'node:fs';
import * as path from 'node:path';

export const apiBaseUrl = () => process.env.API_BASE_URL || 'http://127.0.0.1:18081';

/** 密碼只從環境變數讀取，不記錄、不輸出。 */
export function testPassword(): string {
  const value = process.env.TEST_PASSWORD;
  if (!value) throw new Error('缺少環境變數 TEST_PASSWORD，無法登入測試帳號。');
  return value;
}

export type AccountKey =
  | 'restaurantA'
  | 'restaurantB'
  | 'customerA'
  | 'customerB'
  | 'driverA'
  | 'driverB';

export type CaseAccounts = Record<AccountKey, string>;

const ACCOUNTS_FILE = path.resolve(__dirname, '../../../shared/accounts.json');

let cache: Record<string, CaseAccounts> | undefined;

/** 每個案例 ID 在 accounts.json 都有一組獨立帳號；測試不與其他案例共用。 */
export function accountsFor(caseId: string): CaseAccounts {
  cache ??= JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));
  const accounts = cache![caseId];
  if (!accounts) throw new Error(`accounts.json 沒有案例 ${caseId} 的帳號。`);
  return accounts;
}

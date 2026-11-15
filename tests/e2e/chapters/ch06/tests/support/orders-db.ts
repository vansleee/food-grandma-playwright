import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

interface OrderRow {
  id: number;
  restaurant_id: number;
  address: string;
  total: number;
  meal_id: number | null;
  quantity: number | null;
}

export function readCustomerOrders(username: string): OrderRow[] {
  const { CH06_DB_PATH, CH06_PYTHON } = process.env;
  if (!CH06_DB_PATH || !CH06_PYTHON) {
    throw new Error('請使用章節指令執行第 06 章，讓執行器提供本次測試的 SQLite 檔案。');
  }

  const output = execFileSync(
    CH06_PYTHON,
    [resolve(__dirname, 'read_customer_orders.py'), CH06_DB_PATH, username],
    { encoding: 'utf8' },
  );
  return JSON.parse(output) as OrderRow[];
}

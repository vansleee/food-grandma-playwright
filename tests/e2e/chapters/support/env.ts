import * as fs from 'fs';
import * as path from 'path';

export const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:18081';

export const RESTAURANT_TOKEN_KEY = 'food_grandma_restaurant_token';
export const DRIVER_TOKEN_KEY = 'food_alpaca_driver_token';

export type Role = 'restaurantA' | 'restaurantB' | 'customerA' | 'customerB' | 'driverA' | 'driverB';
export type CaseAccounts = Record<Role, string>;

const accountsFile = path.resolve(__dirname, '../data/accounts.json');
let cache: Record<string, CaseAccounts> | undefined;

/** Usernames dedicated to one original case ID (see accounts.json). */
export function accountsFor(caseId: string): CaseAccounts {
  cache ??= JSON.parse(fs.readFileSync(accountsFile, 'utf-8'));
  const accounts = cache![caseId];
  if (!accounts) throw new Error(`No accounts defined for ${caseId}`);
  return accounts;
}

export function testPassword(): string {
  const password = process.env.TEST_PASSWORD;
  if (!password) throw new Error('TEST_PASSWORD environment variable is required');
  return password;
}

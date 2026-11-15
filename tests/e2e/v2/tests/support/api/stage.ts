import { expect, type APIRequestContext } from '@playwright/test';
import { testPassword, type AccountKey, type CaseAccounts } from '../env';
import { AccessTokenAuth, BearerAuth, RoleApiClient } from './role-client';
import { CustomerRepository, DriverRepository, RestaurantRepository } from './repositories';

/**
 * 一個測試的 API 舞台：以案例專屬帳號透過真實 POST /api/social/token/ 取得 token，
 * 再依角色挑選認證 Strategy。只會為測試實際用到的帳號登入。
 */
export class Stage {
  private readonly tokens = new Map<AccountKey, string>();

  constructor(
    private readonly request: APIRequestContext,
    readonly accounts: CaseAccounts,
  ) {}

  async token(key: AccountKey): Promise<string> {
    const cached = this.tokens.get(key);
    if (cached) return cached;
    const response = await this.request.post('/api/social/token/', {
      form: { username: this.accounts[key], password: testPassword() },
    });
    expect(response.ok(), `${key} 取得 token：HTTP ${response.status()}`).toBe(true);
    const { access_token } = await response.json();
    this.tokens.set(key, access_token);
    return access_token;
  }

  async restaurant(key: 'restaurantA' | 'restaurantB' = 'restaurantA') {
    return new RestaurantRepository(new RoleApiClient(this.request, new BearerAuth(await this.token(key))));
  }

  async customer(key: 'customerA' | 'customerB') {
    return new CustomerRepository(new RoleApiClient(this.request, new AccessTokenAuth(await this.token(key))));
  }

  async driver(key: 'driverA' | 'driverB') {
    return new DriverRepository(new RoleApiClient(this.request, new AccessTokenAuth(await this.token(key))));
  }
}

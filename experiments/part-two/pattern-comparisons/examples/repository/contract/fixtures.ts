import { test as base } from '@playwright/test';
import { Api } from '../../../baseline/tests/support/api';
import { API_BASE_URL } from '../../../baseline/tests/support/env';
import { World } from '../../../baseline/tests/support/fixtures';
import { ApiMealsRepository, type MealsRepository } from '../meals-repository';
import { InMemoryMealsRepository } from '../in-memory-meals-repository';

export const repositoryKind = process.env.REPOSITORY_KIND || 'api';
if (!['api', 'fake'].includes(repositoryKind)) throw new Error('REPOSITORY_KIND must be api or fake');

export const test = base.extend<{ repository: MealsRepository }>({
  repository: async ({ playwright }, use, testInfo) => {
    if (repositoryKind === 'fake') {
      await use(new InMemoryMealsRepository());
      return;
    }
    const caseId = /^RCON-T\d{2}/.exec(testInfo.title)![0];
    const request = await playwright.request.newContext({ baseURL: API_BASE_URL });
    try {
      const api = new Api(request);
      const restaurant = await new World(api, caseId).restaurant();
      await use(new ApiMealsRepository(api, request, restaurant.token));
    } finally {
      await request.dispose();
    }
  },
});

export { expect } from '@playwright/test';

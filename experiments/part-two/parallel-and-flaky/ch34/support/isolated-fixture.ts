import { World } from '../../baseline/tests/support/fixtures';
import { labTest } from './test-base';

export const test = labTest.extend({
  subject: async ({ api }, use, testInfo) => {
    const caseId = /^PAR-T\d{2}/.exec(testInfo.title)![0];
    const world = new World(api, caseId);
    const restaurant = await world.restaurant();
    const meal = await world.meal(restaurant, {
      name: `${caseId} meal`,
      short_description: `${caseId} original description`,
      price: 100,
    });
    await use({ restaurant, meal });
  },
});

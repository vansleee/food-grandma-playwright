import baseConfig from '../../playwright.config';

export default {
  ...baseConfig,
  testDir: '.',
  grep: undefined,
  projects: [
    { name: 'before', testMatch: '**/meal-load.before.spec.ts' },
    { name: 'after', testMatch: '**/meal-load.after.spec.ts' },
  ],
};

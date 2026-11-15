import baseConfig from '../../playwright.config';

export default {
  ...baseConfig,
  testDir: '.',
  testMatch: '**/*.spec.ts',
};

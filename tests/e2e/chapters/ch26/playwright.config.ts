import baseConfig from '../playwright.config';

export default {
  ...baseConfig,
  testDir: '.',
  testIgnore: [],
  projects: [
    { name: 'shared', testMatch: '**/worker-mode/parallel-meals.shared.spec.ts' },
    { name: 'before', testMatch: '**/worker-mode/parallel-meals.before.spec.ts' },
    { name: 'after', testMatch: '**/worker-mode/parallel-meals.after.spec.ts' },
    { name: 'ai-generated', testMatch: '**/ai-generated/with-repository.spec.ts' },
  ],
};

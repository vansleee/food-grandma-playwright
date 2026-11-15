import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { MealView } from '../../baseline/tests/support/api';
import { test as base, expect, type Restaurant } from '../../baseline/tests/support/fixtures';

export type Subject = { restaurant: Restaurant; meal: MealView };
type Fixtures = {
  subject: Subject;
  meet: (phase: 'loaded' | 'saved') => Promise<void>;
};

export const labTest = base.extend<Fixtures>({
  subject: async () => {
    throw new Error('Choose the shared or isolated subject fixture.');
  },

  // 實驗用同步點：兩個 worker 都讀完原值、都儲存後才往下走，讓干擾可以重現。
  // 一個 worker 時不等待另一案例；這段不是產品測試需要的修法。
  meet: async ({}, use, testInfo) => {
    const participants = Math.min(testInfo.config.workers, 2);
    const root = process.env.LAB_SYNC_DIR;
    if (!root) throw new Error('LAB_SYNC_DIR is required');
    const caseId = /^PAR-T\d{2}/.exec(testInfo.title)![0];
    await use(async (phase) => {
      if (participants === 1) return;
      const folder = path.join(root, phase);
      await mkdir(folder, { recursive: true });
      await writeFile(path.join(folder, `${caseId}.json`), JSON.stringify({ caseId, phase }));
      await expect.poll(async () => (await readdir(folder)).filter((name) => name.endsWith('.json')).length,
        { timeout: 10_000, message: `Both cases must reach ${phase}` }).toBe(participants);
    });
  },
});

export { expect };

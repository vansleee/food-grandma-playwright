import { copyFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const project = join(root, 'tests/e2e/ai-agent/food-grandma-fastapi');
const base = join(project, 'tests/generated/06-test-maintenance');
const [action, number, ...flags] = process.argv.slice(2);
if (action === 'network') {
  const result = spawnSync('npx', ['playwright', 'test', 'tests/generated/06-test-maintenance/e2e/network-practice.spec.ts', '--config=playwright.generated.config.ts', '--project=e2e', '--workers=1', '--retries=0'], {
    cwd: project,
    env: { ...process.env, WEB_BASE_URL: process.env.WEB_BASE_URL ?? 'http://localhost:8082', API_BASE_URL: process.env.API_BASE_URL ?? 'http://localhost:8081' },
    stdio: 'inherit', shell: process.platform === 'win32'
  });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
if (!['prepare', 'run', 'agent'].includes(action) || !/^(0[1-9]|10)$/.test(number ?? '')) {
  console.error('Usage: node scripts/maintenance-challenge.mjs prepare|run|agent 01..10 [--correct-environment]');
  process.exit(2);
}
const name = `case-${number}`;
const target = join(base, 'e2e', `${name}.spec.ts`);
if (action === 'prepare') {
  copyFileSync(join(base, 'examples', `${name}.before.ts`), target);
  console.log(`Prepared ${name}; other exercises were not changed.`);
  process.exit(0);
}
if (!existsSync(target)) throw new Error(`Prepare ${name} before running it.`);
const env = { ...process.env, WEB_BASE_URL: process.env.WEB_BASE_URL ?? 'http://localhost:8082', API_BASE_URL: process.env.API_BASE_URL ?? 'http://localhost:8081' };
if (!flags.includes('--correct-environment')) {
  if (number === '07') env.WEB_BASE_URL = 'http://localhost:59999';
  if (number === '08') env.CHALLENGE_AUTH_TOKEN = 'expired-training-token';
} else {
  delete env.CHALLENGE_AUTH_TOKEN;
}
const command = action === 'agent' ? 'claude' : 'npx';
const configName = `.maintenance-mcp-${process.pid}.json`;
const configPath = join(project, configName);
const args = action === 'agent'
  ? ['--strict-mcp-config', '--mcp-config', configName]
  : ['playwright', 'test', `tests/generated/06-test-maintenance/e2e/${name}.spec.ts`, '--config=playwright.generated.config.ts', '--project=e2e', '--workers=1', '--retries=0'];
if (action === 'agent') {
  writeFileSync(configPath, JSON.stringify({ mcpServers: { 'playwright-test': {
    command: 'npx', args: ['playwright', 'run-test-mcp-server', '--config', join(project, 'playwright.generated.config.ts'), '--headless']
  } } }, null, 2));
}
let status;
try {
  const result = spawnSync(command, args, { cwd: project, env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  status = result.status ?? 1;
} finally {
  if (action === 'agent') rmSync(configPath, { force: true });
}
process.exit(status);

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../ch20/role-sessions.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const module = { exports: {} };
vm.runInNewContext(compiled.outputText, { module, exports: module.exports, AggregateError });
const { RoleSessions } = module.exports;

function context({ newPageFails = false, screenshotFails = false, closeFails = false } = {}) {
  return {
    closed: false,
    async addInitScript() {},
    async newPage() {
      if (newPageFails) throw new Error('newPage failed');
      return { isClosed: () => false, url: () => 'http://example.test/', async screenshot() {
        if (screenshotFails) throw new Error('screenshot failed');
        return Buffer.from('test-image');
      } };
    },
    async close() { this.closed = true; if (closeFails) throw new Error('close failed'); },
  };
}
function pool(contexts) {
  const remaining = [...contexts];
  return new RoleSessions({ async newContext() { return remaining.shift(); } }, {});
}
function info(overrides = {}) { return { status: 'passed', annotations: [], async attach() {}, ...overrides }; }

test('partial setup failure still closes every created context', async () => {
  const a = context(); const b = context({ newPageFails: true }); const sessions = pool([a, b]);
  await sessions.open('a', 'key', 'token');
  await assert.rejects(async () => {
    try { await sessions.open('b', 'key', 'token'); }
    finally { await sessions.dispose(info({ status: 'failed' })); }
  }, /newPage failed/);
  assert.ok(a.closed && b.closed);
});
test('screenshot failure is recorded and does not block closing other roles', async () => {
  const a = context({ screenshotFails: true }); const b = context(); const sessions = pool([a, b]); const result = info();
  await sessions.open('a', 'key', 'token'); await sessions.open('b', 'key', 'token');
  await sessions.dispose(result);
  assert.ok(a.closed && b.closed); assert.equal(result.annotations[0].type, 'evidence-error');
});
test('attachment failure still closes the context', async () => {
  const a = context(); const sessions = pool([a]); const result = info({ async attach() { throw new Error('attachment failed'); } });
  await sessions.open('a', 'key', 'token'); await sessions.dispose(result);
  assert.ok(a.closed); assert.equal(result.annotations[0].type, 'evidence-error');
});
test('a close failure does not skip closing the remaining contexts', async () => {
  const a = context({ closeFails: true }); const b = context(); const sessions = pool([a, b]);
  await sessions.open('a', 'key', 'token'); await sessions.open('b', 'key', 'token');
  await assert.rejects(() => sessions.dispose(info()), { name: 'AggregateError' });
  assert.ok(a.closed && b.closed);
});
test('cleanup failure does not replace the original test error', async () => {
  const a = context({ closeFails: true }); const sessions = pool([a]); const result = info({ status: 'failed' });
  const original = new Error('original test failure'); await sessions.open('a', 'key', 'token');
  await assert.rejects(async () => {
    try { throw original; } finally { await sessions.dispose(result); }
  }, (error) => error === original);
  assert.ok(a.closed); assert.equal(result.annotations[0].type, 'cleanup-error');
});

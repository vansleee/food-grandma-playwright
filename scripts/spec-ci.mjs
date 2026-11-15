import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const ROOT = 'tests/e2e/ai-agent/food-grandma-fastapi/tests/generated';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const fail = message => { throw new Error(message); };
export function specSlug(file) {
  if (!/^specs\/[a-zA-Z0-9][a-zA-Z0-9_/-]*\.md$/.test(file) || file.includes('..') || /(^|\/)readme\.md$/i.test(file)) fail(`Invalid spec: ${file}`);
  return file.slice(6, -3).replaceAll('/', '--');
}
export function specCases(file) {
  return [...new Set([...fs.readFileSync(file, 'utf8').matchAll(/\|\s*([A-Z][A-Z0-9-]*-T\d+)\s*\|/g)].map(m => m[1]))];
}
export function verifyReport(report, requiredCases = []) {
  if (report.errors?.length) fail('Playwright collection/runtime errors');
  const specs = [];
  const visit = suites => { for (const suite of suites ?? []) { specs.push(...(suite.specs ?? [])); visit(suite.suites); } };
  visit(report.suites);
  const tests = specs.flatMap(s => s.tests ?? []);
  if (!tests.length) fail('Zero tests is not a passing result');
  for (const test of tests) {
    if (test.expectedStatus !== 'passed' || test.status !== 'expected' || !test.results?.length || test.results.some(r => r.status !== 'passed')) fail('Skipped, flaky, expected-failure or failing test');
  }
  for (const id of requiredCases) if (!specs.some(s => s.title.includes(id))) fail(`Case not executed: ${id}`);
  return tests.length;
}
function selected() { return JSON.parse(fs.readFileSync('.spec-ci-runtime/specs.json', 'utf8')); }
function guard(base, specs) {
  if (git('rev-parse', 'HEAD') !== base) fail('Agent must not commit or change HEAD');
  const changed = new Set([
    ...git('diff', '--name-only', base).split('\n'),
    ...git('ls-files', '--others', '--exclude-standard').split('\n'),
  ].filter(Boolean));
  const prefixes = specs.map(s => `${ROOT}/${specSlug(s)}/`);
  for (const file of changed) {
    if (!prefixes.some(p => file.startsWith(p)) || !/\.(ts|json|md)$/.test(file)) fail(`Out-of-scope change: ${file}`);
    if (!fs.existsSync(file) || fs.lstatSync(file).isSymbolicLink() || !fs.lstatSync(file).isFile()) fail(`Deletion/symlink not allowed: ${file}`);
  }
  if (!changed.size) fail('Agent produced no test changes');
  return [...changed];
}
function inventory(specs) {
  for (const file of specs) {
    const dir = `${ROOT}/${specSlug(file)}`;
    const manifest = JSON.parse(fs.readFileSync(`${dir}/coverage.json`, 'utf8'));
    if (manifest.spec !== file || manifest.blocked?.length) fail(`Incomplete spec: ${file}`);
    const cases = specCases(file);
    if (!cases.length) fail(`Spec needs acceptance case IDs in table rows: ${file}`);
    for (const id of cases) {
      const item = manifest.cases?.find(c => c.id === id);
      if (!item || !['api', 'e2e', 'acceptance'].includes(item.layer) || !/^[a-zA-Z0-9_/-]+\.spec\.ts$/.test(item.file) || item.file.includes('..') || !item.file.startsWith(`${item.layer}/`) || !fs.existsSync(`${dir}/${item.file}`)) fail(`Missing coverage: ${id}`);
    }
    for (const layer of ['api', 'e2e', 'acceptance']) {
      if (!fs.existsSync(`${dir}/${layer}`) || !fs.readdirSync(`${dir}/${layer}`).some(f => f.endsWith('.spec.ts'))) fail(`Missing ${layer} tests for ${file}`);
    }
  }
}
function main() {
  const [command, arg] = process.argv.slice(2);
  if (command === 'select') {
    fs.mkdirSync('.spec-ci-runtime', {recursive:true});
    const specs = fs.existsSync(ROOT) ? fs.readdirSync(ROOT).flatMap(slug => {
      const file = `${ROOT}/${slug}/coverage.json`;
      if (!fs.existsSync(file)) fail(`Missing coverage manifest: ${slug}`);
      const spec = JSON.parse(fs.readFileSync(file,'utf8')).spec;
      if (specSlug(spec) !== slug || !fs.existsSync(spec)) fail(`Invalid manifest: ${file}`);
      return [spec];
    }) : [];
    if (!specs.length) fail('No generated specifications');
    fs.writeFileSync('.spec-ci-runtime/specs.json',JSON.stringify(specs));
  } else if (command === 'detect') {
    fs.mkdirSync('.spec-ci-runtime', { recursive: true });
    let specs;
    if (process.env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
      specs = (process.env.SPEC_PATHS ?? '').split(/[\s,]+/).filter(Boolean);
      if (!specs.length) fail('Manual run requires spec_paths');
    } else {
      const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
      if (!event.before || /^0+$/.test(event.before)) fail('Cannot identify previous master revision');
      specs = git('diff', '--no-renames', '--diff-filter=A', '--name-only', event.before, 'HEAD', '--', 'specs/').split('\n').filter(f => f.endsWith('.md') && !/(^|\/)readme\.md$/i.test(f));
    }
    specs = [...new Set(specs)];
    for (const s of specs) { specSlug(s); if (!fs.existsSync(s)) fail(`Missing ${s}`); }
    if (new Set(specs.map(specSlug)).size !== specs.length) fail('Spec slug collision');
    fs.writeFileSync('.spec-ci-runtime/specs.json', JSON.stringify(specs));
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${specs.length}\nbase=${git('rev-parse', 'HEAD')}\n`);
  } else if (command === 'guard') {
    const files = guard(arg, selected());
    inventory(selected());
    execFileSync('git', ['add', '--', ...files]);
    fs.writeFileSync('.spec-ci-runtime/tests.patch', execFileSync('git', ['diff', '--cached', '--binary', arg]));
  } else if (command === 'inventory') {
    inventory(selected());
  } else if (command === 'reports') {
    const reports = ['api', 'e2e', 'acceptance'].map(layer => JSON.parse(fs.readFileSync(`.spec-ci-runtime/${layer}.json`, 'utf8')));
    for (const report of reports) verifyReport(report);
    for (const file of selected()) {
      const slug = specSlug(file);
      const manifest = JSON.parse(fs.readFileSync(`${ROOT}/${slug}/coverage.json`, 'utf8'));
      for (const layer of ['api','e2e','acceptance']) {
        const matching = [];
        const visit = suites => { for (const suite of suites ?? []) { for (const spec of suite.specs ?? []) if (spec.file.replaceAll('\\', '/').includes(`${slug}/${layer}/`)) matching.push(spec); visit(suite.suites); } };
        visit(reports[['api','e2e','acceptance'].indexOf(layer)].suites);
        verifyReport({suites:[{specs:matching}]});
      }
      for (const item of manifest.cases) {
        const report = reports[['api','e2e','acceptance'].indexOf(item.layer)];
        const matching = [];
        const visit = suites => { for (const suite of suites ?? []) { for (const spec of suite.specs ?? []) if (spec.file.replaceAll('\\', '/').endsWith(`${slug}/${item.file}`) && spec.title.includes(item.id)) matching.push({ title: spec.title, tests: spec.tests }); visit(suite.suites); } };
        visit(report.suites);
        verifyReport({ suites: [{ specs: matching }] }, [item.id]);
      }
    }
    console.log('All three layers passed with complete declared acceptance-case coverage.');
  } else fail(`Unknown command ${command}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();

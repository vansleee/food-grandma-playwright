import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../..');
const [requestedTarget, ...extra] = process.argv.slice(2);
const target = /^[4-7]$/.test(requestedTarget ?? '') ? `0${requestedTarget}` : requestedTarget;
if (!target || ['--help', '-h'].includes(target)) {
  console.log('用法：npm run chapter -- <04～07 | 15～28 | all | v1 | v2>');
  console.log('例如：npm run chapter -- 22');
  console.log('多數章節依序執行未使用本章做法、v1、v2，均採 Arrange／Act／Assert。');
  console.log('第 19 章依序比較 POM、流暢介面（Fluent Interface）、Workflow Facade。');
  console.log('第 20 章比較角色分工的 POM 與 Screenplay。');
  console.log('各版本都從同一份初始資料庫狀態開始。');
  console.log('第 26 章比較一個／兩個 worker；第 27 章各版本執行二十次，固定等待反例會保留失敗。');
  process.exit(0);
}
if (!/^(?:0[4-7]|1[5-9]|2[0-8]|all|v[12])$/.test(target)) {
  console.error('請指定第 04～07 章、第 15～28 章、all、v1 或 v2。');
  process.exit(1);
}
const activePython = process.env.VIRTUAL_ENV && path.join(process.env.VIRTUAL_ENV, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const pythonIn = (directory) => path.join(directory, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const projectPython = pythonIn(path.join(repoRoot, '.venv'));
const backendPython = pythonIn(path.join(repoRoot, 'food-grandma-fastapi/.venv'));
const candidates = [process.env.FOOD_GRANDMA_PYTHON, activePython, projectPython, backendPython, 'python3', 'python', 'py'].filter(Boolean);
const python = candidates.find((candidate) => {
  if (candidate.includes(path.sep) && !existsSync(candidate)) return false;
  return spawnSync(candidate, ['-c', 'import fastapi, sqlmodel, uvicorn, passlib, bcrypt, multipart, stripe'], { stdio: 'ignore' }).status === 0;
});
if (!python) {
  console.error('找不到已安裝 Food Grandma 後端套件的 Python。');
  console.error('請先在範例專案根目錄依序執行：');
  if (process.platform === 'win32') {
    console.error('  py -3 -m venv .venv');
    console.error('  .\\.venv\\Scripts\\python.exe -m pip install -r food-grandma-fastapi/requirements.txt');
  } else {
    console.error('  python3 -m venv .venv');
    console.error('  .venv/bin/python -m pip install -r food-grandma-fastapi/requirements.txt');
  }
  console.error('完成後回到 tests/e2e/chapters，再執行同一個 npm run chapter 指令；程式會自動找到 .venv。');
  console.error('若使用其他 Python 環境，也可以設定 FOOD_GRANDMA_PYTHON 為其執行檔完整路徑。');
  process.exit(1);
}
const child = spawn(python, [path.join(here, 'run_chapter.py'), '--node', process.execPath, target, ...extra], { stdio: 'inherit' });
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });

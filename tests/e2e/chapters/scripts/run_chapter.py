from pathlib import Path
import argparse
import datetime
import json
import os
import re
import secrets
import shutil
import signal
import socket
import sqlite3
import subprocess
import sys
import time
import uuid
import zipfile

LAB = Path(__file__).resolve().parents[1]
REPO = LAB.parents[2]
ROOT = None
PASSWORD = None
NODE = None
PYTHON = Path(sys.executable)
BDD_CHAPTERS = ('04', '06')
SINGLE_RUN_CHAPTERS = (*BDD_CHAPTERS, '07')
CHAPTER_CONFIGS = (*SINGLE_RUN_CHAPTERS, '05')

def environment():
    value = os.environ.copy()
    value.update(TEST_PASSWORD=PASSWORD, WEB_BASE_URL='http://127.0.0.1:18082',
                 API_BASE_URL='http://127.0.0.1:18081', PUBLIC_DEMO_MODE='false', SEED_DEMO_DATA='false')
    value['PYTHONPATH'] = str(REPO / 'food-grandma-fastapi') + os.pathsep + value.get('PYTHONPATH', '')
    value['NODE_PATH'] = os.pathsep.join([str(LAB / 'node_modules'), str(REPO / 'food-grandma-management/node_modules'),
                                        str(REPO / 'food-grandma-web/node_modules'), value.get('NODE_PATH', '')])
    return value

def state():
    file = ROOT / 'service-pids.json'
    return json.loads(file.read_text()) if file.exists() else {}

def stop(name):
    current = state()
    if name not in current:
        return
    try: os.kill(current[name]['pid'], signal.SIGTERM)
    except ProcessLookupError: pass
    current.pop(name)
    (ROOT / 'service-pids.json').write_text(json.dumps(current, indent=2))
    port = {'api':18081, 'management':18880, 'web':18082}[name]
    for _ in range(100):
        with socket.socket() as probe:
            if probe.connect_ex(('127.0.0.1',port)) != 0: return
        time.sleep(.05)
    raise RuntimeError(f'Owned service did not stop: {name}')

def launch(name, command, cwd, env, logfile, port):
    with socket.socket() as probe:
        if probe.connect_ex(('127.0.0.1',port)) == 0:
            raise RuntimeError(f'Port {port} is occupied; refusing to replace a service.')
    with logfile.open('a') as log:
        process = subprocess.Popen(command, cwd=cwd, env=env, stdout=log,
                                   stderr=subprocess.STDOUT, start_new_session=(os.name != 'nt'))
    current=state();current[name]={'pid':process.pid,'command':command}
    (ROOT/'service-pids.json').write_text(json.dumps(current,indent=2))
    for _ in range(200):
        if process.poll() is not None:raise RuntimeError(f'{name} exited; see {logfile}')
        with socket.socket() as probe:
            if probe.connect_ex(('127.0.0.1',port)) == 0:return
        time.sleep(.05)
    raise RuntimeError(f'{name} startup timed out')

def sanitize(folder, database, extra_secrets=()):
    secrets=[PASSWORD, *extra_secrets]
    if database is not None:
        with sqlite3.connect(database) as db:
            secrets += [row[0] for row in db.execute('select token from accesstoken')]
    def scrub(data):
        try:text=data.decode('utf-8')
        except UnicodeDecodeError:return data
        for secret in secrets:text=text.replace(secret,'<redacted>')
        return text.encode()
    for file in folder.rglob('*'):
        if not file.is_file():continue
        if file.suffix=='.zip':
            replacement=file.with_suffix('.sanitized.zip')
            with zipfile.ZipFile(file) as source,zipfile.ZipFile(replacement,'w',zipfile.ZIP_DEFLATED) as output:
                for entry in source.infolist():output.writestr(entry,scrub(source.read(entry.filename)))
            replacement.replace(file)
        elif file.suffix in ('.log','.json','.jsonl','.txt','.md'):
            file.write_bytes(scrub(file.read_bytes()))

def prepare_servers():
    for name, app, port, base, proxy in [
        ('management', 'food-grandma-management', 18880, '/management/', {'/api': 'http://127.0.0.1:18081'}),
        ('web', 'food-grandma-web', 18082, '/', {'/api': 'http://127.0.0.1:18081', '/management': {'target': 'http://127.0.0.1:18880', 'ws': True}}),
    ]:
        if name in state():
            continue
        appdir = REPO / app
        plugin = appdir / 'node_modules/@vitejs/plugin-react'
        entry = plugin / json.loads((plugin / 'package.json').read_text())['module']
        config = ROOT / f'{name}.config.mjs'
        settings = {'root': str(appdir), 'base': base, 'server': {'host': '127.0.0.1', 'port': port, 'strictPort': True, 'proxy': proxy}}
        config.write_text('import { defineConfig } from ' + json.dumps((appdir / 'node_modules/vite/dist/node/index.js').as_uri()) + ';\n'
                          + 'import react from ' + json.dumps(entry.as_uri()) + ';\n'
                          + 'const settings = ' + json.dumps(settings) + ';\n'
                          + 'export default defineConfig({...settings,plugins:[react()]});\n')
        launch(name, [NODE, str(appdir / 'node_modules/vite/bin/vite.js'), '--config', str(config)],
               appdir, environment(), ROOT / f'{name}-service.log', port)


def seed(source, label):
    target = ROOT / f'seeded-{label}.db'
    if not target.exists():
        env = environment()
        env['DATABASE_URL'] = 'sqlite:///' + target.as_posix()
        subprocess.run([str(PYTHON), str(source / 'seed_accounts.py')],
                       cwd=REPO / 'food-grandma-fastapi', env=env, check=True)
    return target


def run_phase(target, extra, variant=None):
    folder = ROOT / target / variant if variant else ROOT / target
    folder.mkdir(parents=True)
    stop('api')
    version = target in ('v1', 'v2')
    source = REPO / 'tests/e2e/shared' if version else LAB / 'data'
    database = ROOT / (f'{target}-{variant}.db' if variant else f'{target}.db')
    shutil.copy2(seed(source, 'versions' if version else 'chapters'), database)
    env = environment()
    env['DATABASE_URL'] = 'sqlite:///' + database.as_posix()
    demo_reset_key = None
    if target == '21' and variant in ('general-fixture', 'focused-fixtures'):
        demo_reset_key = secrets.token_hex(24)
        env.update(DEMO_RESET_KEY=demo_reset_key, CH27_DEMO_RESET_KEY=demo_reset_key)
    launch('api', [str(PYTHON), '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '18081'],
           REPO / 'food-grandma-fastapi', env, folder / 'api-service.log', 18081)
    prepare_servers()
    env.update(RESULT_JSON=str(folder / 'results.json'), TEST_OUTPUT_DIR=str(folder / 'artifacts'))
    if target in BDD_CHAPTERS:
        env[f'CH{target}_BDD_OUTPUT_DIR'] = str(folder / 'features-gen')
    elif not version:
        env['CHAPTER'] = target
        if variant is not None:
            env['CHAPTER_VARIANT'] = variant
    if target == '06':
        env.update(CH06_DB_PATH=str(database), CH06_PYTHON=str(PYTHON))
    cwd = REPO / 'tests/e2e' / target if version else LAB
    resolve_cli = "const p=require('path');const r=require('module').createRequire(require.resolve('@playwright/test/package.json'));process.stdout.write(p.join(p.dirname(r.resolve('playwright/package.json')),'cli.js'));"
    cli = Path(subprocess.check_output([NODE, '-e', resolve_cli], cwd=cwd, env=env).decode())
    options = ['--workers=2' if target == '26' and variant in ('after', 'v2') else '--workers=1', '--retries=0']
    if target == '27':
        options.append('--repeat-each=20')
    config = f'ch{target}/playwright.config.ts' if target in CHAPTER_CONFIGS else 'playwright.config.ts'
    command = [NODE, str(cli), 'test', '--config', config, *options, *extra]
    (folder / 'launch.json').write_text(json.dumps({'command': command, 'cwd': str(cwd), 'target': target,
        'variant': variant, 'database': str(database), 'password_source': 'TEST_PASSWORD', 'source_instrumented': False}, indent=2))
    print(f'\n執行 {target} {variant or ""}，結果資料夾：{folder}', flush=True)
    with (folder / 'stdout.log').open('w') as output:
        if target in BDD_CHAPTERS:
            bdd_cli = LAB / 'node_modules/playwright-bdd/dist/cli/index.js'
            subprocess.run([NODE, str(bdd_cli), '--config', config], cwd=cwd, env=env, check=True)
        child = subprocess.Popen(command, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in child.stdout:
            line = line.replace(PASSWORD, '<redacted>')
            output.write(line)
            print(line, end='', flush=True)
        status = child.wait()
    sanitize(folder, database, (demo_reset_key,) if demo_reset_key else ())
    (folder / 'exit.json').write_text(json.dumps({'exit_code': status}))
    return status


def run_target(target, extra, selected_variant=None):
    if target in (*SINGLE_RUN_CHAPTERS, 'v1', 'v2'):
        return run_phase(target, extra)
    status = 0
    settings = next(item for item in json.loads((LAB / 'chapters.json').read_text()) if item['chapter'] == int(target))
    variants = settings.get('variants', ['before', 'after'])
    for variant in [selected_variant] if selected_variant else variants:
        status = max(status, run_phase(target, extra, variant))
    return status


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--node', required=True)
    parser.add_argument('target')
    parser.add_argument('--variant', help='只執行指定的章節版本')
    args, extra = parser.parse_known_args()
    if args.target not in (*CHAPTER_CONFIGS, 'all', 'v1', 'v2') and args.target not in [str(i) for i in range(15, 29)]:
        parser.error('Target must be 04–07, 15–28, all, v1 or v2')
    if args.variant:
        if args.target in SINGLE_RUN_CHAPTERS or not args.target.isdigit():
            parser.error('--variant 必須搭配第 05 章或第 15～28 章的單一章號')
        settings = next(item for item in json.loads((LAB / 'chapters.json').read_text()) if item['chapter'] == int(args.target))
        if args.variant not in settings.get('variants', ['before', 'after']) + settings.get('optional_variants', []):
            parser.error(f'第 {args.target} 章沒有 {args.variant} 版本')
    for app in ('food-grandma-management', 'food-grandma-web'):
        if not (REPO / app / 'node_modules/vite/bin/vite.js').exists():
            parser.error(f'請先在專案根目錄執行：npm --prefix {app} install')
    if not (LAB / 'node_modules/playwright/cli.js').exists():
        parser.error('請先在 chapters 資料夾執行 npm install')
    NODE = args.node
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:6]
    ROOT = Path(os.environ.get('CHAPTER_RUN_ROOT', str(LAB / 'test-results'))) / stamp
    ROOT.mkdir(parents=True)
    PASSWORD = os.environ.get('TEST_PASSWORD') or secrets.token_hex(16)
    secret_file = ROOT / 'private-runtime.json'
    secret_file.write_text(json.dumps({'password': PASSWORD}))
    secret_file.chmod(0o600)
    targets = [str(i) for i in range(15, 29)] if args.target == 'all' else [args.target]
    (ROOT / 'plan.json').write_text(json.dumps({'targets': targets, 'extra': extra}, indent=2))
    status = 0
    try:
        for target in targets:
            status = max(status, run_target(target, extra, args.variant))
    finally:
        for name in ('api', 'management', 'web'):
            stop(name)
        print(f'\n本次啟動的獨立服務已停止。執行紀錄：{ROOT}', flush=True)
    sys.exit(status)

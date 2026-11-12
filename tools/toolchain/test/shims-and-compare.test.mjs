import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..');
const win = { skip: process.platform !== 'win32' };

for (const tool of ['flutter', 'dart']) {
  test(`${tool} shim keeps APPDATA inside the toolchain folder and forwards args and exit code`, win, () => {
    const root = mkdtempSync(join(tmpdir(), 'shim test '));
    mkdirSync(join(root, 'flutter', 'bin'), { recursive: true });
    writeFileSync(join(root, 'flutter', 'bin', `${tool}.bat`), '@echo APPDATA=%APPDATA%\r\n@echo ARGS=%*\r\n@exit /b 7\r\n');
    // /s + verbatim: cmd strips only the outer quotes, so the quoted path with spaces survives.
    const r = spawnSync('cmd.exe', ['/d', '/s', '/c', `""${join(dir, 'shims', `${tool}.cmd`)}" "a b" --x "pkg:^1.2.0""`], {
      encoding: 'utf8', env: { ...process.env, M3_TOOLCHAIN: root }, windowsVerbatimArguments: true,
    });
    assert.equal(r.status, 7, r.stdout + r.stderr);
    assert.match(r.stdout, new RegExp(`APPDATA=${join(root, 'flutter-appdata').replace(/\\/g, '\\\\')}\\r?\\n`));
    // M4: carets must reach flutter.bat unchanged (`call` would double them).
    assert.match(r.stdout, /ARGS="a b" --x "pkg:\^1\.2\.0"\r?\n/);
    assert.ok(existsSync(join(root, 'flutter-appdata')));
  });
}

test('snapshot compare ignores the JVM class-data-sharing marker in java -version', win, () => {
  const t = mkdtempSync(join(tmpdir(), 'compare test '));
  const base = {
    userPath: 'a', machinePath: 'b', userJavaHome: null, machineJavaHome: null,
    entries: { APPDATA: ['x'], LOCALAPPDATA: ['y'], USERPROFILE: ['z'] },
  };
  const j = 'java version "1.8.0_251"\nJava HotSpot(TM) Client VM (build 25.251-b08, mixed mode';
  writeFileSync(join(t, 'a.json'), JSON.stringify({ ...base, systemJava: j + ', sharing)' }));
  writeFileSync(join(t, 'b.json'), JSON.stringify({ ...base, systemJava: j + ')' }));
  const r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(dir, 'check.ps1'),
    '-Before', join(t, 'a.json'), '-After', join(t, 'b.json')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /IDENTICAL\s+systemJava/);
});

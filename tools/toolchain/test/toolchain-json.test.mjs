import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'toolchain.json');

test('toolchain.json parses and pins every component with a checksum', () => {
  const cfg = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(cfg.root, String.raw`%USERPROFILE%\.m3-toolchain`);
  for (const name of ['jdk', 'flutter', 'cmdlinetools']) {
    const c = cfg.components[name];
    assert.match(c.url, /^https:\/\//, name);
    assert.ok(['SHA256', 'SHA1'].includes(c.checksum.algo), name);
    assert.match(c.checksum.value, /^[0-9a-f]{40}([0-9a-f]{24})?$/, name);
    assert.ok(c.version && c.dir, name);
  }
  assert.ok(cfg.androidPackages.length > 0);
});

test('cmdline-tools stays on 22.0 (classic sdkmanager --licenses) without the Android CLI launcher', () => {
  const cfg = JSON.parse(readFileSync(file, 'utf8'));
  const c = cfg.components.cmdlinetools;
  // 23.0 replaced sdkmanager with the Android CLI: no --licenses prompt, no licenses/ files, metrics on by default.
  assert.match(c.version, /^22\.0 /);
  assert.equal(c.url, 'https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip');
  assert.deepEqual(c.checksum, { algo: 'SHA1', value: 'b9862337a13e2809a5159dc3a08d058091bd59f6' });
  assert.deepEqual(c.removeAfterExtract, ['bin/android.exe']);
  const setup = readFileSync(join(dirname(file), 'setup.ps1'), 'utf8');
  assert.match(setup, /removeAfterExtract/);
});

test('PowerShell scripts are ASCII-only (Windows PowerShell 5.1 reads BOM-less UTF-8 as ANSI)', () => {
  for (const f of ['env.ps1', 'setup.ps1', 'accept-licenses.ps1', 'check.ps1', 'snapshot-system.ps1']) {
    const buf = readFileSync(join(dirname(file), f));
    assert.ok(buf.every(b => b < 0x80), f);
  }
});

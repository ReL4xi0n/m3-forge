import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const script = join(dirname(fileURLToPath(import.meta.url)), '..', 'snapshot-system.ps1');

test('snapshot entries are plain string arrays', { skip: process.platform !== 'win32' }, () => {
  const out = join(mkdtempSync(join(tmpdir(), 'snapshot test ')), 'snap.json');
  const r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Out', out], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const snap = JSON.parse(readFileSync(out, 'utf8').replace(/^﻿/, ''));
  for (const loc of ['APPDATA', 'LOCALAPPDATA', 'USERPROFILE']) {
    const v = snap.entries[loc];
    assert.ok(Array.isArray(v) && v.length > 0, loc);
    assert.ok(v.every(x => typeof x === 'string'), `${loc} has non-string entries: ${JSON.stringify(v[0]).slice(0, 80)}`);
  }
  assert.equal(typeof snap.systemJava, 'string');
});

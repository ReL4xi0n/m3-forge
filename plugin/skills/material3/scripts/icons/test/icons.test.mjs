import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkNames, editDistance } from '../names.mjs';
import { icons } from '../index.mjs';

const INDEX = fileURLToPath(new URL('../index.mjs', import.meta.url));

test('editDistance', () => {
  assert.equal(editDistance('settings', 'setings'), 1);
  assert.equal(editDistance('', 'abc'), 3);
});

test('checkNames: one unknown, settings suggested first', () => {
  const r = checkNames(['settings', 'setings']);
  assert.deepEqual(r.known, ['settings']);
  assert.equal(r.unknown.length, 1);
  assert.equal(r.unknown[0].name, 'setings');
  assert.equal(r.unknown[0].suggestions[0], 'settings');
  assert.ok(r.unknown[0].suggestions.length <= 3);
});

test('icons: unknown names exit 4 with suggestions', async () => {
  const r = await icons({ projectDir: '.', platform: 'web', names: ['home', 'setings'] });
  assert.equal(r.exitCode, 4);
  assert.equal(r.unknown[0].suggestions[0], 'settings');
});

test('icons: valid names without a back end exit 5', async () => {
  const r = await icons({ projectDir: '.', platform: 'compose', names: ['home'] });
  assert.equal(r.exitCode, 5);
  assert.match(r.error, /not implemented for compose/);
});

test('icons: a registered back end is called with the defaults', async () => {
  let seen;
  const r = await icons({
    projectDir: '.', platform: 'web', names: ['home'],
    backends: { web: async (req) => { seen = req; return { written: [] }; } },
  });
  assert.equal(r.exitCode, 0);
  assert.equal(seen.style, 'outlined');
  assert.deepEqual(seen.fill, [0, 1]);
});

test('icons: Outlined never calls fetch', async () => {
  const real = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error('network'); };
  try {
    await icons({ projectDir: '.', platform: 'web', names: ['home'], backends: { web: async () => ({}) } });
  } finally {
    globalThis.fetch = real;
  }
  assert.equal(calls, 0);
});

test('CLI: path with spaces, closed-port proxy, exit codes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'm3 icons cli '));
  const env = { ...process.env, HTTPS_PROXY: 'http://127.0.0.1:9', HTTP_PROXY: 'http://127.0.0.1:9' };
  try {
    const ok = spawnSync(process.execPath, [INDEX, dir, '--platform', 'compose', '--names', 'home'], { env, encoding: 'utf8' });
    assert.equal(ok.status, 5); // compose has no back end yet
    assert.deepEqual(JSON.parse(ok.stdout).known, ['home']);
    const bad = spawnSync(process.execPath, [INDEX, dir, '--platform', 'web', '--names', 'setings'], { env, encoding: 'utf8' });
    assert.equal(bad.status, 4);
    assert.equal(JSON.parse(bad.stdout).unknown[0].suggestions[0], 'settings');
    const usage = spawnSync(process.execPath, [INDEX, dir], { env, encoding: 'utf8' });
    assert.equal(usage.status, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

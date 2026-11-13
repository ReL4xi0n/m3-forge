import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sample } from './helpers.mjs';

const INDEX = fileURLToPath(new URL('../index.mjs', import.meta.url));

test('cli: --out receives verify.json, capture.json runtime is used, exit code follows errors', async () => {
  const out = await mkdtemp(join(tmpdir(), 'm3-verify-cli-'));
  try {
    const capture = join(out, 'capture.json');
    await writeFile(capture, JSON.stringify({
      platform: 'web',
      buildOk: true,
      shots: [],
      runtime: { contrast: [{ where: 'p.note', detail: 'contrast 3.0:1, needs 4.5:1' }], targets: [] },
      raw: {},
    }));
    const r = spawnSync(process.execPath, [INDEX, sample('web', 'off-grid-spacing-hit'), 'web', capture, '--out', out], { encoding: 'utf8' });
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stdout, /off-grid-spacing/);
    assert.match(r.stdout, /contrast/);
    const json = JSON.parse(await readFile(join(out, 'verify.json'), 'utf8'));
    assert.equal(json.platform, 'web');
    assert.equal(json.counts['off-grid-spacing'], 3);
    assert.equal(json.counts.contrast, 1);
    assert.equal(json.exitCode, 1);
    assert.ok(json.uiLines > 0);
    assert.ok(Array.isArray(json.allowlisted));
    assert.ok(!JSON.stringify(json).includes(out.replace(/\\/g, '\\\\')), 'no absolute paths in verify.json');
    assert.ok(!existsSync(join(sample('web', 'off-grid-spacing-hit'), 'verify.json')));
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test('cli: without --out, verify.json goes to the project folder; warnings alone exit 0', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'm3-verify-cli-'));
  try {
    await cp(sample('web', 'off-grid-spacing-hit'), dir, { recursive: true });
    const r = spawnSync(process.execPath, [INDEX, dir, 'web'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const json = JSON.parse(await readFile(join(dir, 'verify.json'), 'utf8'));
    assert.equal(json.counts['off-grid-spacing'], 3);
    assert.equal(json.runtimeChecked, false);
    // A second run does not scan its own verify.json.
    const again = spawnSync(process.execPath, [INDEX, dir, 'web'], { encoding: 'utf8' });
    assert.equal(again.status, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('cli: bad arguments print usage and exit 2', () => {
  const r = spawnSync(process.execPath, [INDEX], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage/i);
});

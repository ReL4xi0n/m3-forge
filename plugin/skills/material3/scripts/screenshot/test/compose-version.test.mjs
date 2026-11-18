// Compose below 1.5: the project copy (the compose-1.5 fixture pinned to 1.4.0) keeps its Gradle and
// dependency files byte for byte through detect, the below-1.5 install step and a screenshot run (fake
// wrapper). Only the theme files are added, in the source folder.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { detect } from '../../detect/index.mjs';
import { installAssets } from '../../install-assets/index.mjs';
import { screenshot } from '../index.mjs';

const FIXTURE = fileURLToPath(new URL('../../../../../../evals/fixtures/compose-1.5/', import.meta.url));

function snapshot(dir, out = {}, base = dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) snapshot(p, out, base);
    else out[p.slice(base.length)] = createHash('sha256').update(readFileSync(p)).digest('hex');
  }
  return out;
}

test('1.4.0 copy of the fixture: belowExpressive, the install step adds theme files only, no Gradle file changes', async () => {
  const dir = join(realpathSync.native(mkdtempSync(join(tmpdir(), 'm3 below-'))), 'my app');
  cpSync(FIXTURE, dir, { recursive: true });
  const toml = join(dir, 'gradle', 'libs.versions.toml');
  writeFileSync(toml, readFileSync(toml, 'utf8').replace('1.5.0-rc01', '1.4.0'));
  const before = snapshot(dir);

  const d = await detect(dir, {});
  assert.equal(d.composeMaterial3, '1.4.0');
  assert.equal(d.belowExpressive, true);
  assert.deepEqual(snapshot(dir), before, 'detect writes nothing');

  const r = installAssets({ projectDir: dir, platform: 'compose', parts: ['theme-below-1.5'], packageName: 'com.example.fixture' });
  assert.deepEqual(r.conflicts, []);
  const after = snapshot(dir);
  const changed = Object.keys(before).filter((f) => after[f] !== before[f]);
  assert.deepEqual(changed, [], 'no existing file changes');
  const added = Object.keys(after).filter((f) => !(f in before));
  assert.ok(added.length > 0 && added.every((f) => /src.main.(kotlin|res).*.(kt|ttf|txt|xml)$/.test(f)), added.join(', '));
  assert.ok(!added.some((f) => /\.(gradle|kts|toml|properties)$/.test(f)));

  // The screenshot step (no toolchain: skipped for the missing wrapper tools) writes nothing either.
  const snap2 = snapshot(dir);
  const s = await screenshot({ projectDir: dir, platform: 'compose', env: { PATH: '' }, tools: { java: { exe: 'java', major: 21 }, sdk: tmpdir() } });
  assert.equal(s.ran, false);
  assert.deepEqual(snapshot(dir), snap2);
});

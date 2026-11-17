import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncVersions, syncReport, TARGETS } from '../sync-versions.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const skill = join(root, 'plugin/skills/material3');
const versions = JSON.parse(readFileSync(join(skill, 'versions.json'), 'utf8'));
const fontsJson = JSON.parse(readFileSync(join(root, 'tools/toolchain/fonts.json'), 'utf8'));
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

test('every bundled font file matches versions.json (hash and size) and fonts.json', () => {
  assert.ok(versions.fonts.length >= 8);
  for (const f of versions.fonts) {
    const p = join(skill, 'assets/fonts', f.file);
    assert.equal(sha(p), f.sha256, f.file);
    assert.equal(statSync(p).size, f.bytes, f.file);
    assert.ok(f.source, f.file);
    const tc = fontsJson.files.find((x) => x.name === f.file);
    if (tc) assert.equal(tc.sha256, f.sha256, `${f.file} vs fonts.json`);
  }
});

test('versions.json has the pinned shape', () => {
  assert.deepEqual(Object.keys(versions.compose).sort(), ['agp', 'compileSdk', 'gradle', 'kotlin', 'material3']);
  assert.ok(versions.flutter.materialUi && versions.mcu && versions.symbols.commit);
  assert.ok(Array.isArray(versions.tools));
});

test('syncVersions check is empty on the repo and reports absent targets', () => {
  assert.deepEqual(syncVersions({ check: true }), []);
  const rep = syncReport({});
  assert.ok(rep.absent.length >= 0 && TARGETS.length >= 2);
});

test('syncVersions check detects a catalog edit and skips absent files', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'sync versions '));
  try {
    for (const t of TARGETS) {
      mkdirSync(join(tmp, t, '..'), { recursive: true });
      cpSync(join(root, t), join(tmp, t));
    }
    cpSync(join(skill, 'versions.json'), join(tmp, 'plugin/skills/material3/versions.json'), { recursive: true });
    assert.deepEqual(syncVersions({ check: true, root: tmp }), []);
    const f = join(tmp, TARGETS[0]);
    writeFileSync(f, readFileSync(f, 'utf8').replace('1.5.0-rc01', '1.4.0'));
    assert.deepEqual(syncVersions({ check: true, root: tmp }), [TARGETS[0]]);
    assert.equal(readFileSync(f, 'utf8').includes('1.4.0'), true, 'check must not write');
    const rep = syncReport({ root: tmp });
    assert.ok(rep.absent.includes('plugin/skills/material3/assets/compose/template/gradle/libs.versions.toml'));
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REQUESTS = ['landing', 'settings', 'dashboard', 'product-detail', 'onboarding', 'empty-error'];
const FIXTURES = { web: ['web-empty', 'web-react', 'web-vue'], flutter: ['flutter-material_ui', 'flutter-legacy'], compose: ['compose-1.5'] };

test('run matrix: 26 cells = 18 core + 8 coverage (spec §12, option B)', () => {
  const cells = JSON.parse(readFileSync(join(root, 'cells.json'), 'utf8'));
  assert.equal(cells.length, 26);
  assert.equal(new Set(cells.map(c => c.cell)).size, 26, 'cell ids are unique');
  for (const c of cells) {
    assert.ok(REQUESTS.includes(c.request), c.cell);
    assert.ok(FIXTURES[c.platform]?.includes(c.fixture), c.cell);
    assert.match(c.variant, /^(default|classic|seed:#[0-9A-F]{6})$/, c.cell);
    assert.equal(c.cell, `${c.request}.${c.platform}.${c.fixture}.${c.variant.replace('seed:#', 'seed-')}`);
  }
  const core = cells.filter(c => c.variant === 'default' && !['web-vue', 'flutter-legacy'].includes(c.fixture));
  assert.equal(core.length, 18);
  for (const r of REQUESTS) for (const p of Object.keys(FIXTURES)) {
    assert.equal(core.filter(c => c.request === r && c.platform === p).length, 1, `${r} × ${p}`);
  }
  assert.equal(core.filter(c => c.fixture === 'web-empty').length, 3);
  assert.equal(core.filter(c => c.fixture === 'web-react').length, 3);
  assert.equal(cells.filter(c => c.fixture === 'web-vue').length, 1);
  assert.equal(cells.filter(c => c.fixture === 'flutter-legacy').length, 1);
  for (const p of Object.keys(FIXTURES)) {
    assert.equal(cells.filter(c => c.platform === p && c.variant === 'classic').length, 1, `classic × ${p}`);
    assert.equal(cells.filter(c => c.platform === p && c.variant.startsWith('seed:')).length, 1, `seed × ${p}`);
  }
  assert.equal(new Set(cells.filter(c => c.variant.startsWith('seed:')).map(c => c.variant)).size, 1, 'one fixed seed');
});

test('every request and the variants file exist and never name Material components', () => {
  for (const r of REQUESTS) {
    const p = join(root, 'prompts', `${r}.md`);
    assert.ok(existsSync(p), p);
    const t = readFileSync(p, 'utf8');
    assert.ok(t.trim().split(/\s+/).length >= 40, `${r} is a real request`);
    assert.doesNotMatch(t, /material|\bM3\b|\bFAB\b|snackbar|navigation rail|chip|segmented/i, r);
  }
  const v = readFileSync(join(root, 'prompts', 'variants.md'), 'utf8');
  assert.match(v, /^- default: .*M3 Expressive/m);
  assert.match(v, /^- classic: .*classic Material 3/m);
  assert.match(v, /#[0-9A-F]{6}/);
});

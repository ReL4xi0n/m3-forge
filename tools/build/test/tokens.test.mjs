import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, statSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveEntry, ladderUses, ladderUseLine, keyOf } from '../ladder.mjs';
import { buildSkillTokens, resolveToken, renderFiles, loadMerged, MAX_BYTES, OTHER_BUILD_FILES } from '../tokens.mjs';
import { renderAll } from '../../extract/tokens/report.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const tokensDir = join(root, 'plugin/skills/material3/tokens');
const cli = join(root, 'tools/build/tokens.mjs');
const NF = 'NOT FOUND';
const merged = loadMerged();

// A minimal merged.json entry: per-platform values plus the Android views cross-check.
const entry = (id, { web = NF, flutter = NF, compose = NF, mdc = NF, ...extra } = {}) => ({
  id, ...extra, canonical: web, perPlatform: { web, flutter, compose }, crossCheck: { 'android-views': mdc },
  provenance: { canonical: null, web: null, flutter: null, compose: null, 'android-views': null },
});

const magnitude = v => {
  if (v.shape) {
    assert.ok(v.shape.corners.every(c => c === v.shape.corners[0]), 'uniform corners');
    return v.shape.corners[0];
  }
  return v.dp ?? v.number;
};

test('md.sys.shape.corner.large-increased resolves to 20 on all three platforms', () => {
  for (const p of ['web', 'flutter', 'compose']) {
    const r = resolveToken('md.sys.shape.corner.large-increased', p);
    assert.equal(r.provenance, 'own', p);
    assert.equal(magnitude(r.value), 20, p);
  }
});

test('a token NOT FOUND on Flutter (and web) but present in Compose resolves cross-source:compose-material3', () => {
  // Real data: compose-only height of the large flexible app bar (id derived from the Compose name).
  const id = 'md.comp.app-bar-large-flexible.large-container-height';
  const e = merged.find(x => x.id === id);
  assert.equal(e.perPlatform.flutter, NF);
  assert.equal(e.perPlatform.web, NF);
  const r = resolveToken(id, 'flutter');
  assert.equal(r.provenance, 'cross-source:compose-material3');
  assert.deepEqual(r.value, e.perPlatform.compose);
});

test('rung 1 order follows precedence: own repo, then material-web (canonical), then the other platform, then Android views', () => {
  const e = entry('md.comp.x.height', { web: { dp: 4 }, compose: { dp: 5 }, mdc: { dp: 6 } });
  assert.deepEqual(resolveEntry(e, 'flutter'), { value: { dp: 4 }, provenance: 'cross-source:material-web' });
  const e2 = entry('md.comp.x.height', { flutter: { number: 7 }, compose: { dp: 5 } });
  assert.deepEqual(resolveEntry(e2, 'web'), { value: { dp: 5 }, provenance: 'cross-source:compose-material3' });
  const e3 = entry('md.comp.x.height', { mdc: { dp: 6 } });
  assert.deepEqual(resolveEntry(e3, 'compose'), { value: { dp: 6 }, provenance: 'cross-source:material-components-android' });
});

test('a component color token missing everywhere resolves derived: to its mapped role (synthetic fixture)', () => {
  // No platform repo has the token; the only data is a reference to a sys color role (Android views).
  const targets = new Set(['md.sys.color.primary-container']);
  const e = entry('md.comp.x.container.color', { mdc: { ref: 'md.sys.color.primary-container' } });
  for (const p of ['web', 'flutter', 'compose']) {
    assert.deepEqual(resolveEntry(e, p, { targets }), { value: { ref: 'md.sys.color.primary-container' }, provenance: 'derived:md.sys.color.primary-container' }, p);
  }
});

test('a component color token without a value in any repo but mapped to a role in the data resolves derived: (real data)', () => {
  // Compose has no app-bar search container color; material-web and material_ui map it to a sys color role.
  const id = 'md.comp.app-bar.search.container.color';
  const e = merged.find(x => x.id === id);
  assert.equal(e.perPlatform.compose, NF);
  assert.ok(e.perPlatform.web.ref.startsWith('md.sys.color.'));
  const r = resolveToken(id, 'compose');
  assert.equal(r.provenance, `derived:${e.perPlatform.web.ref}`);
  assert.deepEqual(r.value, { ref: e.perPlatform.web.ref });
});

test('a literal value from another repo wins over a role mapping (rung 1 before rung 2)', () => {
  const targets = new Set(['md.sys.shape.corner.full']);
  const e = entry('md.comp.x.shape', { web: { ref: 'md.sys.shape.corner.full' }, compose: { dp: 9 } });
  assert.deepEqual(resolveEntry(e, 'flutter', { targets }), { value: { dp: 9 }, provenance: 'cross-source:compose-material3' });
});

test('a reference from another repo is rung 2, also to a md.ref token (ruling R10)', () => {
  const targets = new Set(['md.ref.palette.primary20']);
  const e = entry('md.sys.color.primary', { mode: 'light-high-contrast', web: { ref: 'md.ref.palette.primary20' } });
  assert.deepEqual(resolveEntry(e, 'compose', { targets }), { value: { ref: 'md.ref.palette.primary20' }, provenance: 'derived:md.ref.palette.primary20' });
  // Real data: only Android views has the mode-less fixed roles, as references to palette tones.
  assert.deepEqual(resolveToken('md.sys.color.on-primary-fixed', 'web'), { value: { ref: 'md.ref.palette.primary10' }, provenance: 'derived:md.ref.palette.primary10' });
  // Real data: a concrete value (Flutter's hex) beats material-web's palette reference for Compose.
  const r = resolveToken('md.sys.color.primary', 'compose', 'light-high-contrast');
  assert.deepEqual(r, { value: { hex: '#381e72ff' }, provenance: 'cross-source:material_ui' });
});

test('a reference to a deprecated or missing token is skipped, also on the own platform', () => {
  const merged2 = [
    entry('md.sys.typescale.label-medium.weight.prominent', { web: { ref: 'md.ref.typeface.weight-bold' }, deprecated: true }),
    entry('md.ref.typeface.weight-bold', { web: { number: 700 } }),
    entry('md.comp.nav.active.label-text.weight', { web: { ref: 'md.sys.typescale.label-medium.weight.prominent' } }),
    entry('md.comp.nav.label-text.weight', { web: { ref: 'md.sys.typescale.label-medium.weight.prominent' }, compose: { ref: 'md.sys.nowhere' }, mdc: { number: 500 } }),
  ];
  const built = buildSkillTokens(merged2);
  for (const p of ['web', 'flutter', 'compose']) assert.deepEqual(built.comp['md.comp.nav.active.label-text.weight'][p], [null, 'library-default'], p);
  assert.deepEqual(built.comp['md.comp.nav.label-text.weight'].web, [{ number: 500 }, 'cross-source:material-components-android']);
  assert.deepEqual(built.comp['md.comp.nav.label-text.weight'].flutter, [{ number: 500 }, 'cross-source:material-components-android']);
  // Real data: material-web maps these to the deprecated md.sys.typescale.label-*.weight.prominent.
  for (const id of ['md.comp.navigation-bar.active.label-text.weight', 'md.comp.navigation-rail.active.label-text.weight', 'md.comp.navigation-drawer.active.label-text.weight']) {
    for (const p of ['web', 'flutter', 'compose']) assert.deepEqual(resolveToken(id, p), { value: null, provenance: 'library-default' }, `${id} ${p}`);
  }
});

test('no cell holds a dangling reference: every target resolves on the same platform', () => {
  const built = buildSkillTokens();
  const all = { ...built.sys, ...built.comp };
  const live = { web: new Set(), flutter: new Set(), compose: new Set() };
  for (const [key, plat] of Object.entries(all)) {
    for (const [p, [v]] of Object.entries(plat)) {
      if (v === null) continue;
      const parts = key.split('@')[0].split('.');
      for (let i = 1; i <= parts.length; i++) live[p].add(parts.slice(0, i).join('.'));
    }
  }
  let refs = 0;
  for (const [key, plat] of Object.entries(all)) {
    for (const [p, [v]] of Object.entries(plat)) {
      if (!v?.ref) continue;
      refs++;
      assert.ok(live[p].has(v.ref), `${key} ${p} -> ${v.ref}`);
    }
  }
  assert.ok(refs > 5000);
});

test('nothing usable anywhere is left at the library default; deprecated tokens are not used', () => {
  const e = entry('md.comp.x.width', { web: { unparsed: '/* Type "custom_composite" is not supported. */ null' } });
  for (const p of ['web', 'flutter', 'compose']) assert.deepEqual(resolveEntry(e, p), { value: null, provenance: 'library-default' });
  const built = buildSkillTokens([entry('md.comp.old.width', { web: { dp: 1 }, deprecated: true }), entry('md.comp.new.width', { web: { dp: 2 } })]);
  assert.deepEqual(Object.keys(built.comp), ['md.comp.new.width']);
});

test('multi-context tokens keep one key per mode (id@mode)', () => {
  const built = buildSkillTokens();
  const modes = merged.filter(e => e.id === 'md.sys.color.primary').map(e => e.mode);
  assert.ok(modes.length >= 6);
  for (const m of modes) assert.ok(built.sys[`md.sys.color.primary@${m}`], m);
  assert.equal(built.sys['md.sys.color.primary'], undefined);
  assert.notDeepEqual(built.sys['md.sys.color.primary@light'].flutter[0], built.sys['md.sys.color.primary@dark'].flutter[0]);
  assert.deepEqual(resolveToken('md.sys.color.primary', 'flutter', 'dark'), { value: { hex: '#d0bcffff' }, provenance: 'own' });
  assert.deepEqual(resolveToken('md.sys.color.primary@dark', 'flutter'), { value: { hex: '#d0bcffff' }, provenance: 'own' });
  assert.equal(resolveToken('md.sys.color.primary', 'flutter'), null, 'a multi-context token needs a mode');
  assert.equal(resolveToken('md.comp.no-such.token', 'web'), null);
});

test('nothing returns a value (or a number) that is not in merged.json', () => {
  const built = buildSkillTokens();
  const byKey = new Map(merged.map(e => [keyOf(e), e]));
  const numbers = new Set();
  const walk = (v, out) => {
    if (typeof v === 'number') out.add(v);
    else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x, out);
  };
  for (const e of merged) { walk(e.perPlatform, numbers); walk(e.crossCheck, numbers); }
  let cells = 0;
  for (const part of [built.sys, built.comp]) {
    for (const [key, plat] of Object.entries(part)) {
      const e = byKey.get(key);
      assert.ok(e, key);
      const candidates = [...Object.values(e.perPlatform), ...Object.values(e.crossCheck)].map(v => JSON.stringify(v));
      for (const [p, [v, prov]] of Object.entries(plat)) {
        if (v === null) { assert.equal(prov, 'library-default', `${key} ${p}`); continue; }
        cells++;
        assert.ok(candidates.includes(JSON.stringify(v)), `${key} ${p}: ${JSON.stringify(v)}`);
        const found = new Set();
        walk(v, found);
        for (const n of found) assert.ok(numbers.has(n), `${key} ${p}: ${n}`);
      }
    }
  }
  assert.ok(cells > 10000);
});

test('every ladder use appears in not-found.md', () => {
  const md = readFileSync(join(root, 'knowledge/not-found.md'), 'utf8');
  assert.match(md, /^## Ladder uses \(skill tokens\)/m);
  const lines = new Set(md.split(/\r?\n/));
  const uses = ladderUses(merged);
  assert.ok(uses.length > 0);
  for (const u of uses) assert.ok(lines.has(ladderUseLine(u)), ladderUseLine(u));
  const built = buildSkillTokens();
  const inFiles = [built.sys, built.comp].flatMap(part => Object.values(part).flatMap(plat => Object.values(plat)))
    .filter(([, p]) => p.startsWith('cross-source:') || p.startsWith('derived:')).length;
  assert.equal(inFiles, uses.length, 'every rung-1/2 cell in the skill files is a listed ladder use');
});

test('the report generator appends the ladder section from the merged entries', () => {
  let line = 0;
  const rec = (source, id, value) => ({ id, native: id, source, file: `${source}.txt`, line: ++line, kind: 'comp', value, raw: '' });
  const files = renderAll({
    'material-web': [rec('material-web', 'md.comp.x.height', { dp: 40 })],
    material_ui: [], 'compose-material3': [], 'material-components-android': [],
  }, {});
  const md = files.get('not-found.md');
  assert.match(md, /## Ladder uses \(skill tokens\)/);
  assert.ok(md.includes('- md.comp.x.height: flutter cross-source:material-web (40dp)'), md);
  assert.ok(md.includes('- md.comp.x.height: compose cross-source:material-web (40dp)'), md);
});

test('committed token files: up to date, at most 1.5 MB, no forbidden terms', () => {
  const files = renderFiles(buildSkillTokens());
  assert.deepEqual([...files.keys()].sort(), ['comp.json', 'sys.json']);
  let total = 0;
  for (const name of readdirSync(tokensDir)) {
    if (OTHER_BUILD_FILES.has(name)) continue; // precompute-schemes.mjs output, checked by the color tests
    const text = readFileSync(join(tokensDir, name), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(text, files.get(name), `${name} is stale`);
    assert.doesNotMatch(text, /m3-forge|holdout|reference-screenshots/i, name);
    total += statSync(join(tokensDir, name)).size;
  }
  assert.ok(total <= MAX_BYTES, `${total} bytes`);
  assert.equal(MAX_BYTES, 1.5 * 1024 * 1024);
});

test('CLI writes and --check fails on a stale file (path with spaces)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tok build '));
  try {
    const out = join(dir, 'skill tokens');
    mkdirSync(out);
    const mergedFile = join(dir, 'merged copy.json');
    writeFileSync(mergedFile, JSON.stringify([entry('md.sys.shape.corner.x', { web: { dp: 3 }, flutter: { number: 3 } }), entry('md.comp.y.height', { compose: { dp: 8 } })]));
    const run = (...args) => spawnSync(process.execPath, [cli, '--merged', mergedFile, '--out', out, ...args], { encoding: 'utf8' });
    assert.equal(run('--check').status, 1, 'missing files are stale');
    assert.equal(run().status, 0);
    const sys = JSON.parse(readFileSync(join(out, 'sys.json'), 'utf8'));
    assert.deepEqual(sys.tokens['md.sys.shape.corner.x'].compose, [{ dp: 3 }, 'cross-source:material-web']);
    assert.equal(run('--check').status, 0);
    writeFileSync(join(out, 'comp.json'), readFileSync(join(out, 'comp.json'), 'utf8').replace('"dp":8', '"dp":9'));
    const r = run('--check');
    assert.equal(r.status, 1);
    assert.match(r.stderr, /comp\.json/);
    assert.equal(run().status, 0);
    writeFileSync(join(out, 'extra.json'), '{}');
    const x = run('--check');
    assert.equal(x.status, 1, 'an unexpected file in the tokens folder fails the check');
    assert.match(x.stderr, /extra\.json/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

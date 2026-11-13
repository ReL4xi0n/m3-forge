import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { merge, compare } from '../merge.mjs';
import { renderAll, writeAll, checkAll } from '../report.mjs';

let line = 0;
const rec = (source, id, value, extra = {}) => ({
  id, native: id ?? 'm3_unmapped_name', source, file: `${source}.txt`, line: ++line, kind: id ? id.split('.')[1] : 'comp', value, raw: JSON.stringify(value), ...extra,
});

test('compare: refs, ref resolution inside a source, unitless magnitude, not-comparable kinds', () => {
  const idx = new Map([['md.sys.shape.corner.medium', rec('material-web', 'md.sys.shape.corner.medium', { dp: 12 })]]);
  assert.equal(compare({ ref: 'a' }, { ref: 'a' }), 'same');
  assert.equal(compare({ ref: 'md.sys.shape.corner.medium' }, { dp: 12 }, idx, new Map()), 'same');
  assert.equal(compare({ dp: 40 }, { number: 40 }), 'same');
  assert.equal(compare({ dp: 40 }, { number: 40.5 }), 'different');
  assert.equal(compare({ dp: 16 }, { sp: 16 }), 'different');
  assert.equal(compare({ hex: '#000000ff' }, { hex: '#000000ff' }), 'same');
  assert.equal(compare({ unparsed: '1rem' }, { dp: 16 }), 'not-compared');
  assert.equal(compare({ shape: { family: 'X', corners: [0, 0, 0, 0] } }, { dp: 0 }), 'not-compared');
});

test('precedence: each platform keeps its own value, canonical is material-web, disagreement is a conflict', () => {
  const r = merge({
    'material-web': [rec('material-web', 'md.comp.x.height', { dp: 40 })],
    'compose-material3': [rec('compose-material3', 'md.comp.x.height', { dp: 48 })],
    material_ui: [rec('material_ui', 'md.comp.x.height', { number: 40 })],
  }, []);
  const t = r.merged.find(m => m.id === 'md.comp.x.height');
  assert.deepEqual(t.canonical, { dp: 40 });
  assert.deepEqual(t.perPlatform, { web: { dp: 40 }, flutter: { number: 40 }, compose: { dp: 48 } });
  assert.equal(t.provenance.compose.source, 'compose-material3');
  assert.equal(r.conflicts.length, 1);
  assert.equal(r.conflicts[0].kind, 'repo-vs-repo');
  assert.deepEqual(r.conflicts[0].values.map(v => v.where).sort(), ['compose-material3', 'material-web', 'material_ui']);
});

test('NOT FOUND: exact marker, availableIn, whole components collapsed; deprecated and derived ids excluded', () => {
  const r = merge({
    'material-web': [
      rec('material-web', 'md.comp.x.height', { dp: 40 }),
      rec('material-web', 'md.comp.gone.size', { dp: 4 }, { deprecated: true }),
      rec('material-web', 'md.comp.webonly.a', { dp: 1 }), rec('material-web', 'md.comp.webonly.b', { dp: 2 }),
    ],
    'compose-material3': [rec('compose-material3', 'md.comp.x.height', { dp: 40 }), rec('compose-material3', 'md.comp.x.derived-thing', { dp: 3 }, { derived: true })],
    material_ui: [rec('material_ui', 'md.comp.webonly.a', { number: 1 }), rec('material_ui', 'md.comp.x.width', { number: 9 })],
  }, []);
  const t = r.merged.find(m => m.id === 'md.comp.x.height');
  assert.equal(t.perPlatform.flutter, 'NOT FOUND');
  assert.deepEqual(r.notFound.flutter.find(e => e.id === 'md.comp.x.height'), { id: 'md.comp.x.height', component: 'x', availableIn: ['compose-material3', 'material-web'] });
  assert.deepEqual(r.notFound.compose.filter(e => e.component === 'webonly'), [{ id: 'webonly.*', component: 'webonly', availableIn: ['material-web', 'material_ui'], count: 2 }]);
  assert.ok(!Object.values(r.notFound).flat().some(e => e.id.includes('gone') || e.id.includes('derived-thing')));
  assert.equal(r.deprecated.length, 1);
  assert.equal(r.unmapped.length, 1);
});

test('site vs repo: the repo wins and the difference is logged', () => {
  const r = merge({ 'material-web': [rec('material-web', 'md.comp.x.height', { dp: 40 })] },
    [{ page: '/components/x/specs', token: 'md.comp.x.height', value: { dp: 42 }, note: 'knowledge/guidance/components/x.md', line: 7 }]);
  const c = r.conflicts.find(x => x.kind === 'site-vs-repo');
  assert.equal(c.winner, 'material-web');
  assert.deepEqual(c.values, [{ where: 'site:/components/x/specs', value: { dp: 42 } }, { where: 'material-web', value: { dp: 40 } }]);
});

test('report: deterministic output; --check passes on fresh output and fails after a one-character edit', async () => {
  const bySource = {
    'material-web': [rec('material-web', 'md.comp.x.height', { dp: 40 }), rec('material-web', 'md.comp.x.w', { unparsed: '1rem' })],
    'compose-material3': [rec('compose-material3', 'md.comp.x.height', { dp: 48 })],
    material_ui: [], 'material-components-android': [rec('material-components-android', null, { dp: 2 })],
  };
  const mcu = { variants: ['TONAL_SPOT'], roles: ['primary'], specVersions: ['2025'], defaultVariantEvidence: [] };
  const a = renderAll(bySource, mcu, []);
  const b = renderAll(bySource, mcu, []);
  assert.deepEqual([...a.entries()], [...b.entries()]);
  for (const f of ['tokens/material-web.json', 'tokens/merged.json', 'tokens/summary.json', 'tokens/color-system.json', 'conflicts.md', 'not-found.md']) assert.ok(a.has(f), f);
  const summary = JSON.parse(a.get('tokens/summary.json'));
  assert.equal(summary.perSource['material-web'].unparsed, 1);
  assert.equal(summary.perPlatform.compose.conflicts, 1);
  assert.equal(summary.perPlatform.web.notFoundTokens, 0);
  assert.equal(summary.perPlatform.flutter.notFoundTokens, 2, 'every missing token is counted, collapsed or not');
  assert.match(a.get('not-found.md'), /## Unparsed values/);
  assert.match(a.get('not-found.md'), /## Unmapped native names/);
  assert.match(a.get('conflicts.md'), /md\.comp\.x\.height/);

  const dir = await mkdtemp(join(tmpdir(), 'report test '));
  await writeAll(dir, a);
  assert.deepEqual(await checkAll(dir, a), []);
  const f = join(dir, 'conflicts.md');
  await writeFile(f, (await readFile(f, 'utf8')).replace('md.comp', 'md.camp'));
  assert.deepEqual(await checkAll(dir, a), ['conflicts.md']);
});

test('compare: different references whose values cannot be compared are a difference', () => {
  const a = new Map([['md.sys.shape.corner.medium', { value: { dp: 12 } }]]);
  const b = new Map([['md.sys.shape.corner.full', { value: { unparsed: 'CircleShape' } }]]);
  assert.equal(compare({ ref: 'md.sys.shape.corner.medium' }, { ref: 'md.sys.shape.corner.full' }, a, b), 'different');
  assert.equal(compare({ ref: 'md.sys.shape.corner.medium' }, { dp: 12 }, a, null), 'same');
  assert.equal(compare({ ref: 'md.sys.shape.corner.full' }, { dp: 12 }, b, null), 'not-compared');
});

test('compare: a reference to a whole style and to its own sub-token is not a difference', () => {
  assert.equal(compare({ ref: 'md.sys.typescale.label-large' }, { ref: 'md.sys.typescale.label-large.font' }), 'not-compared');
  assert.equal(compare({ ref: 'md.sys.typescale.label-large' }, { ref: 'md.sys.typescale.label-medium.font' }), 'different');
});

test('report: NOT FOUND statements from notes get their own section', () => {
  const bySource = { 'material-web': [rec('material-web', 'md.comp.y.h', { dp: 1 })], 'compose-material3': [], material_ui: [], 'material-components-android': [] };
  const mcu = { variants: [], roles: [], specVersions: [], defaultVariantEvidence: [] };
  const files = renderAll(bySource, mcu, [], [{ note: 'knowledge/guidance/styles/color.md', line: 12, text: '| M3 Expressive | [NOT FOUND] |' }]);
  const md = files.get('not-found.md');
  assert.match(md, /## NOT FOUND in notes: 1/);
  assert.match(md, /knowledge\/guidance\/styles\/color\.md:12/);
});

test('site-backed overrides: site, Flutter and Compose agree against material-web', () => {
  const id = 'md.comp.y.leading-space';
  const sv = { page: '/components/y/specs', token: id, value: { dp: 12 }, note: 'n.md', line: 3 };
  const run = (flutter, compose) => merge({
    'material-web': [rec('material-web', id, { dp: 16 })],
    ...(flutter ? { material_ui: [rec('material_ui', id, flutter)] } : { material_ui: [] }),
    ...(compose ? { 'compose-material3': [rec('compose-material3', id, compose)] } : { 'compose-material3': [] }),
  }, [sv]);
  const hit = run({ number: 12 }, { dp: 12 });
  assert.equal(hit.siteBackedOverrides.length, 1);
  assert.deepEqual(hit.siteBackedOverrides[0], {
    id, site: { page: '/components/y/specs', value: { dp: 12 }, note: 'n.md', line: 3 },
    web: { dp: 16 }, flutter: { number: 12 }, compose: { dp: 12 },
  });
  assert.equal(run({ number: 12 }, { dp: 16 }).siteBackedOverrides.length, 0, 'only Flutter matches the site');
  assert.equal(run({ number: 12 }, null).siteBackedOverrides.length, 0, 'Compose NOT FOUND');
  const files = renderAll({ 'material-web': [rec('material-web', id, { dp: 16 })], material_ui: [rec('material_ui', id, { number: 12 })], 'compose-material3': [rec('compose-material3', id, { dp: 12 })] }, {}, [sv]);
  assert.match(files.get('conflicts.md'), /## Site, Flutter and Compose agree against material-web \(owner decision\) \(1\)/);
  assert.equal(JSON.parse(files.get('tokens/summary.json')).totals.siteBackedOverrides, 1);
});

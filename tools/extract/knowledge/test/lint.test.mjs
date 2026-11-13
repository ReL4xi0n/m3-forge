import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { lintNotes } from '../lint.mjs';

const merged = [
  { id: 'md.comp.filled-button.container.height', canonical: { dp: 40 }, perPlatform: { web: { dp: 40 }, flutter: { number: 40 }, compose: { dp: 40 } }, crossCheck: {} },
  { id: 'md.comp.filled-button.container.shape', canonical: { ref: 'md.sys.shape.corner.medium' }, perPlatform: { web: { ref: 'md.sys.shape.corner.medium' } }, crossCheck: {} },
  { id: 'md.sys.shape.corner.medium', canonical: { dp: 12 }, perPlatform: { web: { dp: 12 } }, crossCheck: {} },
  { id: 'md.comp.filled-button.disabled.container.opacity', canonical: { number: 0.38 }, perPlatform: { web: { number: 0.38 } }, crossCheck: {} },
  { id: 'md.ref.palette.primary40', canonical: { hex: '#6750a4ff' }, perPlatform: { web: { hex: '#6750a4ff' } }, crossCheck: {} },
];
const coverage = { rows: [
  { path: '/components/buttons/specs', status: 'done' },
  { path: '/components/buttons/overview', status: 'done' },
  { path: '/styles/color/roles', status: 'done' },
  { path: '/blog/gone', status: 'failed' },
] };

const COMPONENT_SECTIONS = ['Summary', 'Use it when', 'Anatomy', 'Variants', 'Expressive', 'States and behavior', 'Measurements', 'Accessibility', 'Platform mapping', 'Pitfalls'];

function note({ kind = 'component', pages = ['/components/buttons/specs'], body = {}, drop = [] } = {}) {
  const fm = ['---', 'title: Buttons', `kind: ${kind}`, `pages: [${pages.join(', ')}]`, 'tokenSets: [filled-button]', 'expressive: true', 'fetched: 2026-11-13', '---', ''];
  const sections = COMPONENT_SECTIONS.filter(s => !drop.includes(s)).map(s => `## ${s}\n\n${body[s] ?? 'Not covered by the sources.'}\n`);
  return fm.join('\n') + sections.join('\n');
}

async function run(files, opts = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'lint test '));
  for (const [name, text] of Object.entries(files)) {
    await mkdir(join(dir, name, '..'), { recursive: true });
    await writeFile(join(dir, name), text);
  }
  return lintNotes(dir, { merged, coverage, exceptions: {}, ...opts });
}

test('numbers need a provenance marker on the same line', async () => {
  const { errors } = await run({ 'components/buttons.md': note({ body: { Measurements: 'Height is 40dp.' } }) });
  assert.ok(errors.some(e => /components\/buttons\.md:\d+: number without provenance marker/.test(e)), errors.join('\n'));
});

test('[token:] values must match the token (refs followed, % as fraction, hex)', async () => {
  const ok = await run({ 'components/buttons.md': note({ body: { Measurements: [
    'Height is 40dp [token:md.comp.filled-button.container.height].',
    'Corner radius 12dp [token:md.comp.filled-button.container.shape].',
    'Disabled container at 38% opacity [token:md.comp.filled-button.disabled.container.opacity].',
    'Seed #6750A4 [token:md.ref.palette.primary40].',
  ].join('\n') } }) });
  assert.deepEqual(ok.errors, []);
  const bad = await run({ 'components/buttons.md': note({ body: { Measurements: 'Height is 48dp [token:md.comp.filled-button.container.height].' } }) });
  assert.ok(bad.errors.some(e => /value 48dp does not match token md\.comp\.filled-button\.container\.height/.test(e)), bad.errors.join('\n'));
  const unknown = await run({ 'components/buttons.md': note({ body: { Measurements: 'Gap 8dp [token:md.comp.nope.gap].' } }) });
  assert.ok(unknown.errors.some(e => /unknown token md\.comp\.nope\.gap/.test(e)));
});

test('[site:] lines are collected as site values; a differing token on the same line is not an error', async () => {
  const r = await run({ 'components/buttons.md': note({ body: { Measurements: 'Height is 42dp [site:/components/buttons/specs] [token:md.comp.filled-button.container.height].' } }) });
  assert.deepEqual(r.errors, []);
  assert.equal(r.siteValues.length, 1);
  assert.deepEqual(r.siteValues[0], {
    page: '/components/buttons/specs', token: 'md.comp.filled-button.container.height', value: { dp: 42 }, note: 'knowledge/guidance/components/buttons.md', line: r.siteValues[0].line,
  });
  const notDone = await run({ 'components/buttons.md': note({ body: { Measurements: 'Gap 4dp [site:/blog/gone].' } }) });
  assert.ok(notDone.errors.some(e => /\[site:\/blog\/gone\] is not a scraped page/.test(e)));
});

test('[NOT FOUND] is accepted; sections are required and may not be empty', async () => {
  assert.deepEqual((await run({ 'components/buttons.md': note({ body: { Measurements: 'Hover lift 2dp [NOT FOUND].' } }) })).errors, []);
  const missing = await run({ 'components/buttons.md': note({ drop: ['Measurements'] }) });
  assert.ok(missing.errors.some(e => /missing section "## Measurements"/.test(e)));
  const empty = await run({ 'components/buttons.md': note({ body: { Pitfalls: '' } }) });
  assert.ok(empty.errors.some(e => /empty section "## Pitfalls"/.test(e)));
});

test('front matter is validated and cited pages must be scraped', async () => {
  const bad = await run({ 'components/buttons.md': note({ kind: 'widget', pages: ['/components/nope'] }) });
  assert.ok(bad.errors.some(e => /kind must be one of/.test(e)));
  assert.ok(bad.errors.some(e => /page \/components\/nope is not a scraped page/.test(e)));
});

test('--require-coverage: every scraped page must be cited by some note', async () => {
  const files = { 'components/buttons.md': note({ pages: ['/components/buttons/specs'] }) };
  assert.deepEqual((await run(files)).errors, []);
  const strict = await run(files, { requireCoverage: true });
  assert.ok(strict.errors.includes('page not covered by any note: /components/buttons/overview'), strict.errors.join('\n'));
  assert.ok(strict.errors.includes('page not covered by any note: /styles/color/roles'));
  const excused = await run(files, { requireCoverage: true, exceptions: {
    '/components/buttons/overview': { kind: 'owner-excluded', detail: 'covered elsewhere by owner decision' },
    '/styles/color/roles': { kind: 'owner-excluded', detail: 'covered elsewhere by owner decision' },
  } });
  assert.deepEqual(excused.errors, []);
});

test('table rows: each cell pairs its own value with its own markers', async () => {
  const row = '| Square | 12dp [site:/components/buttons/specs] [token:md.comp.filled-button.container.shape] | 40dp [site:/components/buttons/specs] [token:md.comp.filled-button.container.height] |';
  const r = await run({ 'components/buttons.md': note({ body: { Measurements: `| | A | B |\n|---|---|---|\n${row}` } }) });
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.siteValues.map(s => [s.token, s.value]), [
    ['md.comp.filled-button.container.shape', { dp: 12 }],
    ['md.comp.filled-button.container.height', { dp: 40 }],
  ]);
  const bad = await run({ 'components/buttons.md': note({ body: { Measurements: '| x | 12dp [token:md.comp.filled-button.container.shape] | 41dp [token:md.comp.filled-button.container.height] |' } }) });
  assert.ok(bad.errors.some(e => /value 41dp does not match token md\.comp\.filled-button\.container\.height$/.test(e)), bad.errors.join('\n'));
  assert.ok(!bad.errors.some(e => /value 12dp/.test(e)));
});

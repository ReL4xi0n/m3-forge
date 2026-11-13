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
  { id: 'md.comp.x.leading-space', canonical: { dp: 12 }, perPlatform: { web: { dp: 12 }, flutter: { number: 12 }, compose: { dp: 16 } }, crossCheck: {} },
];
const coverage = { rows: [
  { path: '/components/buttons/specs', status: 'done' },
  { path: '/components/buttons/overview', status: 'done' },
  { path: '/styles/color/roles', status: 'done' },
  { path: '/blog/gone', status: 'failed' },
] };

const COMPONENT_SECTIONS = ['Summary', 'Use it when', 'Anatomy', 'Variants', 'Expressive', 'States and behavior', 'Measurements', 'Typography', 'Color roles and state layers', 'Motion', 'Accessibility', 'Platform mapping', 'Pitfalls'];

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


test('component notes need Typography, Color roles and state layers, Motion; references must resolve', async () => {
  const missing = await run({ 'components/buttons.md': note({ drop: ['Motion'] }) });
  assert.ok(missing.errors.some(e => /missing section "## Motion"/.test(e)));
  const ref = note({ body: { 'Color roles and state layers': 'Same as buttons.md#color-roles-and-state-layers.' } });
  assert.deepEqual((await run({ 'components/split-button.md': ref, 'components/buttons.md': note() })).errors, []);
  const broken = note({ body: { 'Color roles and state layers': 'See buttons.md#colour-roles.' } });
  const r = await run({ 'components/split-button.md': broken, 'components/buttons.md': note() });
  assert.ok(r.errors.some(e => /broken reference buttons\.md#colour-roles/.test(e)), r.errors.join('\n'));
});

test('platform claims: differences must be acknowledged, [same:] and [differs:] are verified, bare agreement wording is rejected', async () => {
  const unack = await run({ 'components/buttons.md': note({ body: { Measurements: 'Side padding 12dp [token:md.comp.x.leading-space].' } }) });
  assert.ok(unack.errors.some(e => /token md\.comp\.x\.leading-space differs between platforms; acknowledge it with \[differs:md\.comp\.x\.leading-space\]/.test(e)), unack.errors.join('\n'));
  const ack = await run({ 'components/buttons.md': note({ body: { Measurements: 'Side padding 12dp [token:md.comp.x.leading-space].\nCompose uses 16dp [token:md.comp.x.leading-space] [differs:md.comp.x.leading-space].' } }) });
  assert.deepEqual(ack.errors, []);
  const wrongDiff = await run({ 'components/buttons.md': note({ body: { Measurements: 'Height 40dp [token:md.comp.filled-button.container.height] [differs:md.comp.filled-button.container.height].' } }) });
  assert.ok(wrongDiff.errors.some(e => /\[differs:md\.comp\.filled-button\.container\.height\] but the platforms agree/.test(e)));
  const same = await run({ 'components/buttons.md': note({ body: { Measurements: 'Height 40dp on every platform [token:md.comp.filled-button.container.height] [same:md.comp.filled-button.container.height].' } }) });
  assert.deepEqual(same.errors, []);
  const sameBad = await run({ 'components/buttons.md': note({ body: { Measurements: 'Padding is identical everywhere [same:md.comp.x.leading-space] [differs:md.comp.x.leading-space].' } }) });
  assert.ok(sameBad.errors.some(e => /\[same:md\.comp\.x\.leading-space\] is not true/.test(e)));
  const claim = await run({ 'components/buttons.md': note({ body: { Measurements: 'The values agree in material-web, Flutter and Compose.' } }) });
  assert.ok(claim.errors.some(e => /platform agreement claim without \[same:\]/.test(e)));
});

test('[impl:] marks values taken from official library code; --files limits the report', async () => {
  const ok = await run({ 'components/buttons.md': note({ body: { Measurements: 'Minimum width 58dp [impl:compose-material3/commonMain/androidx/compose/material3/Button.kt:120].' } }) });
  assert.deepEqual(ok.errors, []);
  const bad = await run({ 'components/buttons.md': note({ body: { Measurements: 'Minimum width 58dp [impl:Button.kt].' } }) });
  assert.ok(bad.errors.some(e => /\[impl:Button\.kt\] must be <source-id>\/<path>:<line>/.test(e)));
  const two = await run({ 'components/buttons.md': note({ body: { Measurements: 'Height 40dp.' } }), 'components/chips.md': note({ body: { Measurements: 'Height 32dp.' } }) },
    { files: ['knowledge/guidance/components/chips.md'] });
  assert.ok(two.errors.length > 0 && two.errors.every(e => e.startsWith('knowledge/guidance/components/chips.md')), two.errors.join('\n'));
});

test('every [NOT FOUND] line in a note is collected for not-found.md', async () => {
  const r = await run({ 'components/buttons.md': note({ body: { Motion: 'Selected-state morph spring: [NOT FOUND].', Measurements: 'Hover lift 2dp [NOT FOUND].' } }) });
  assert.deepEqual(r.notFound.map(n => [n.note, n.text]), [
    ['knowledge/guidance/components/buttons.md', 'Hover lift 2dp [NOT FOUND].'],
    ['knowledge/guidance/components/buttons.md', 'Selected-state morph spring: [NOT FOUND].'],
  ]);
  assert.ok(r.notFound.every(n => Number.isInteger(n.line)));
});

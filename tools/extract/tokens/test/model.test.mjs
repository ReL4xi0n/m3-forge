import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { normalizeValue, derivedId, kebab, squash, buildIndex } from '../model.mjs';
import { extractWeb } from '../web.mjs';
import { extractCompose } from '../compose.mjs';

const fx = name => join(dirname(fileURLToPath(import.meta.url)), 'fixtures', name);

test('normalizeValue: exact numbers, units, colors, easing; anything else stays unparsed', () => {
  assert.deepEqual(normalizeValue('40px', 'material-web'), { dp: 40 });
  assert.deepEqual(normalizeValue('40.0.dp', 'compose-material3'), { dp: 40 });
  assert.deepEqual(normalizeValue('20.0.sp', 'compose-material3'), { sp: 20 });
  assert.deepEqual(normalizeValue('200ms', 'material-web'), { ms: 200 });
  assert.deepEqual(normalizeValue('100.0', 'compose-material3', 'DurationShort2'), { ms: 100 });
  assert.deepEqual(normalizeValue('0.38', 'material-web'), { number: 0.38 });
  assert.deepEqual(normalizeValue('0.38f', 'compose-material3'), { number: 0.38 });
  assert.deepEqual(normalizeValue('Color(0xFF6750A4)', 'compose-material3'), { hex: '#6750a4ff' });
  assert.deepEqual(normalizeValue('#6750A4', 'material-web'), { hex: '#6750a4ff' });
  assert.deepEqual(normalizeValue('Color(red = 103, green = 80, blue = 164)', 'compose-material3'), { hex: '#6750a4ff' });
  assert.deepEqual(normalizeValue('Color(red = 0.4f, green = 0.3f, blue = 0.6f)', 'compose-material3'), { unparsed: 'Color(red = 0.4f, green = 0.3f, blue = 0.6f)' });
  assert.deepEqual(normalizeValue('#000', 'material-web'), { hex: '#000000ff' });
  assert.deepEqual(normalizeValue('cubic-bezier(0.2, 0, 0, 1)', 'material-web'), { easing: [0.2, 0, 0, 1] });
  assert.deepEqual(normalizeValue('CubicBezierEasing(0.2f, 0.0f, 0.0f, 1.0f)', 'compose-material3'), { easing: [0.2, 0, 0, 1] });
  assert.deepEqual(normalizeValue('RoundedCornerShape(16.0.dp)', 'compose-material3'), { dp: 16 });
  assert.deepEqual(normalizeValue("'Roboto'", 'material-web'), { string: 'Roboto' });
  assert.deepEqual(normalizeValue('calc(1px + 2px)', 'material-web'), { unparsed: 'calc(1px + 2px)' });
  assert.deepEqual(normalizeValue('1.25rem', 'material-web'), { unparsed: '1.25rem' });
  assert.deepEqual(normalizeValue('0.30000000000000004', 'material-web'), { number: 0.30000000000000004 }, 'never rounded');
});

test('ids: kebab, separator-insensitive squash, derived ids', () => {
  assert.equal(kebab('OnSurfaceVariant'), 'on-surface-variant');
  assert.equal(kebab('DurationShort2'), 'duration-short2');
  assert.equal(squash('md.comp.filled-button.container.height'), 'mdcompfilledbuttoncontainerheight');
  assert.equal(derivedId('comp', 'filled-button', 'label-text-line-height'), 'md.comp.filled-button.label-text-line-height');
});

test('buildIndex: two native names mapping to one id in a source is an error naming both', () => {
  const rec = (native, line) => ({ id: 'md.comp.x.y', native, source: 'material-web', file: 'f', line, kind: 'comp', value: { dp: 1 }, raw: '1px' });
  assert.throws(() => buildIndex([rec('$y', 1), rec('$y-alias', 2)]), /canonical id collision in material-web: \$y and \$y-alias -> md\.comp\.x\.y/);
  const idx = buildIndex([rec('$y', 1), { ...rec('$y', 3), mode: 'dark' }]);
  assert.equal(idx.size, 2, 'modes are part of the key');
});

const byId = (records, id, mode) => records.find(r => r.id === id && (r.mode ?? null) === (mode ?? null));

test('extractWeb: ids from the doc comments, refs resolved to ids, file and line kept', async () => {
  const r = await extractWeb(fx('web'));
  const h = byId(r, 'md.comp.filled-button.container.height');
  assert.deepEqual(h.value, { dp: 40 });
  assert.equal(h.line, 11);
  assert.equal(h.file, '_md-comp-filled-button.scss');
  assert.equal(h.deprecated, true);
  assert.deepEqual(byId(r, 'md.comp.filled-button.container.color').value, { ref: 'md.sys.color.primary' });
  assert.deepEqual(byId(r, 'md.comp.filled-button.container.shape').value, { ref: 'md.sys.shape.corner.full' });
  assert.deepEqual(byId(r, 'md.comp.filled-button.hover.color').value, { ref: 'md.comp.filled-button.container.color' });
  const derived = byId(r, 'md.comp.filled-button.label-text-line-height');
  assert.deepEqual(derived.value, { unparsed: '1.25rem' });
  assert.equal(derived.derived, true);
  assert.deepEqual(byId(r, 'md.sys.color.primary', 'dark').value, { ref: 'md.ref.palette.primary80' });
  assert.deepEqual(byId(r, 'md.sys.color.primary', 'dark-high-contrast').value, { ref: 'md.ref.palette.primary90' });
  assert.deepEqual(byId(r, 'md.ref.palette.primary40').value, { hex: '#6750a4ff' });
  assert.deepEqual(byId(r, 'md.sys.motion.spring.default.spatial.damping', 'standard').value, { number: 0.9 });
  assert.ok(r.every(x => x.source === 'material-web' && x.raw));
});

test('extractCompose: matched to known ids; getters, consts, sp, durations, easing, spring schemes; no *KeyTokens values', async () => {
  const knownIds = new Set((await extractWeb(fx('web'))).filter(x => !x.derived).map(x => x.id));
  const r = await extractCompose(fx('compose'), { knownIds });
  assert.deepEqual(byId(r, 'md.comp.filled-button.container.height').value, { dp: 40 });
  const color = byId(r, 'md.comp.filled-button.container.color');
  assert.deepEqual(color.value, { ref: 'md.sys.color.primary' });
  assert.equal(color.line, 5);
  assert.equal(color.native, 'FilledButtonTokens.ContainerColor');
  assert.deepEqual(byId(r, 'md.comp.filled-button.container.shape').value, { ref: 'md.sys.shape.corner.full' });
  assert.deepEqual(byId(r, 'md.comp.filled-button.disabled.container.opacity').value, { number: 0.12 });
  const lh = byId(r, 'md.comp.filled-button.label-text-line-height');
  assert.deepEqual(lh.value, { sp: 20 });
  assert.equal(lh.derived, true);
  assert.deepEqual(byId(r, 'md.sys.color.primary', 'dark').value, { ref: 'md.ref.palette.primary80' });
  assert.deepEqual(byId(r, 'md.sys.motion.duration.short2').value, { ms: 100 });
  assert.deepEqual(byId(r, 'md.sys.motion.easing.standard').value, { easing: [0.2, 0, 0, 1] });
  assert.deepEqual(byId(r, 'md.sys.motion.spring.default.spatial.damping', 'expressive').value, { number: 0.8 });
  assert.deepEqual(byId(r, 'md.sys.motion.spring.default.spatial.damping', 'standard').value, { number: 0.9 });
  assert.ok(!r.some(x => /KeyTokens/.test(x.file)), 'no records from *KeyTokens.kt');
  assert.ok(!r.some(x => x.raw.includes('ColorToken(')));
  buildIndex(r);
});

test('extractCompose: reviewed prop rewrites from aliases.json join names Compose spells differently', async () => {
  const knownIds = new Set((await extractWeb(fx('web'))).map(x => x.id));
  const aliases = { 'compose-material3': { TypeScale: { props: [{ pattern: '^(.+?)Emphasized(.+)$', replace: 'Emphasized$1$2' }], why: 'Compose puts Emphasized after the style name' } } };
  const plain = await extractCompose(fx('compose'), { knownIds });
  assert.equal(plain.find(r => r.native === 'TypeScaleTokens.BodyLargeEmphasizedLineHeight').mappedBy, 'word-order', 'the word-order rule covers this without an alias');
  const r = await extractCompose(fx('compose'), { knownIds, aliases });
  const t = r.find(x => x.native === 'TypeScaleTokens.BodyLargeEmphasizedLineHeight');
  assert.equal(t.id, 'md.sys.typescale.emphasized.body-large.line-height');
  assert.equal(t.alias, 'TypeScale');
  assert.equal(t.derived, undefined);
});

test('compose mapping rules: X+Small, state tense, word order; ambiguous or extra-word names stay unmapped', async () => {
  const knownIds = new Set([
    'md.comp.icon-button.xsmall.icon.size',
    'md.comp.icon-button.xsmall.hovered.state-layer.opacity',
    'md.comp.split-button.small.inner-corner.pressed.corner-size',
    'md.comp.split-button.small.trailing-button.icon.size',
    'md.comp.icon-button.xsmall.bogus-thing', 'md.comp.icon-button.xsmall.thing.bogus',
    'md.comp.button.filled.disabled.icon.color',
  ]);
  const r = await extractCompose(fx('compose-rules'), { knownIds });
  const get = n => r.find(x => x.native === n);
  assert.equal(get('XSmallIconButtonTokens.IconSize').id, 'md.comp.icon-button.xsmall.icon.size');
  assert.equal(get('XSmallIconButtonTokens.IconSize').mappedBy, 'word-order');
  assert.equal(get('XSmallIconButtonTokens.HoverStateLayerOpacity').id, 'md.comp.icon-button.xsmall.hovered.state-layer.opacity');
  assert.equal(get('SplitButtonSmallTokens.InnerPressedCornerCornerSize').id, 'md.comp.split-button.small.inner-corner.pressed.corner-size');
  const extra = get('SplitButtonSmallTokens.TrailingIconSize');
  assert.equal(extra.derived, true, 'database has an extra word (button): never inferred');
  const amb = get('XSmallIconButtonTokens.BogusThing');
  assert.equal(amb.derived, true);
  assert.equal(amb.ambiguous, true, 'two candidates with the same words');
  assert.equal(get('FilledIconButtonTokens.DisabledColor').derived, true, 'object words must match the database set, not leak into the property');
});

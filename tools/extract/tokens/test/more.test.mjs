import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildIndex } from '../model.mjs';
import { extractWeb } from '../web.mjs';
import { extractMdc } from '../mdc.mjs';
import { extractFlutter } from '../flutter.mjs';
import { extractMcu } from '../mcu.mjs';

const fx = name => join(dirname(fileURLToPath(import.meta.url)), 'fixtures', name);
const byId = (records, id, mode) => records.find(r => r.id === id && (r.mode ?? null) === (mode ?? null));
const known = async () => new Set((await extractWeb(fx('web'))).map(x => x.id));

test('extractMdc: res/values only, names matched to known ids, unknown names stay unmapped (id null)', async () => {
  const r = await extractMdc(fx('mdc'), { knownIds: await known() });
  assert.deepEqual(byId(r, 'md.comp.filled-button.container.height').value, { dp: 40 });
  assert.equal(byId(r, 'md.comp.filled-button.container.height').native, 'm3_comp_filled_button_container_height');
  assert.deepEqual(byId(r, 'md.comp.filled-button.disabled.container.opacity').value, { number: 0.12 });
  assert.deepEqual(byId(r, 'md.comp.filled-button.container.color').value, { ref: 'md.sys.color.primary' });
  const unknown = r.find(x => x.native === 'm3_comp_mystery_widget_gap_size');
  assert.equal(unknown.id, null);
  assert.deepEqual(unknown.value, { dp: 4 });
  assert.deepEqual(r.find(x => x.native === 'm3_comp_filled_button_hover_color').value, { unparsed: '@android:color/system_accent1_100' });
  assert.deepEqual(byId(r, 'md.ref.palette.primary40').value, { hex: '#6750a4ff' }, 'Android #AARRGGBB');
  assert.ok(!r.some(x => x.file.includes('values-v31')), 'qualified resource dirs are skipped');
  buildIndex(r);
});

test('extractFlutter: doc-comment ids, unitless numbers, color roles, shapes, typescale fields, schemes', async () => {
  const r = await extractFlutter(fx('flutter'), { knownIds: await known() });
  assert.deepEqual(byId(r, 'md.comp.filled-button.container.height').value, { number: 40 });
  const color = byId(r, 'md.comp.filled-button.container.color');
  assert.deepEqual(color.value, { ref: 'md.sys.color.primary' });
  assert.equal(color.line, 7);
  assert.deepEqual(byId(r, 'md.comp.filled-button.container.shape').value,
    { shape: { family: 'SHAPE_FAMILY_CIRCULAR', corners: [0, 0, 0, 0] } });
  assert.deepEqual(byId(r, 'md.comp.filled-button.label-text.font').value, { ref: 'md.sys.typescale.label-large' });
  assert.deepEqual(byId(r, 'md.sys.color.primary', 'dark').value, { hex: '#d0bcffff' });
  assert.deepEqual(byId(r, 'md.sys.motion.duration.short2').value, { ms: 100 });
  assert.deepEqual(byId(r, 'md.sys.motion.easing.standard').value, { easing: [0.2, 0, 0, 1] });
  assert.deepEqual(byId(r, 'md.sys.motion.spring.default.spatial.damping', 'standard').value, { number: 0.9 });
  assert.deepEqual(byId(r, 'md.sys.motion.spring.default.spatial.damping', 'expressive').value, { number: 0.8 });
  assert.deepEqual(byId(r, 'md.sys.typescale.body-large.font').value, { string: 'Roboto' });
  assert.deepEqual(byId(r, 'md.sys.typescale.body-large.size').value, { number: 16 });
  assert.deepEqual(byId(r, 'md.sys.typescale.body-large.weight').value, { number: 400 });
  assert.deepEqual(byId(r, 'md.sys.typescale.body-large.line-height').value, { number: 24 });
  assert.deepEqual(byId(r, 'md.sys.typescale.body-large.tracking').value, { number: 0.5 });
  assert.ok(r.every(x => x.source === 'material_ui'));
  buildIndex(r);
});

test('extractMcu: variants and roles as written, default-variant evidence collected, nothing inferred', async () => {
  const m = await extractMcu(fx('mcu'));
  assert.deepEqual(m.variants, ['MONOCHROME', 'TONAL_SPOT', 'EXPRESSIVE']);
  assert.deepEqual(m.roles, ['on_primary', 'primary']);
  assert.deepEqual(m.specVersions, ['2021', '2025']);
  assert.deepEqual(m.defaultVariantEvidence, [
    { file: 'scheme/scheme_tonal_spot.js', line: 3, text: 'super({ variant: Variant.TONAL_SPOT, sourceColorHct, isDark });' },
  ]);
  assert.equal(m.defaultVariant, undefined, 'the default is decided later from evidence, never here');
});

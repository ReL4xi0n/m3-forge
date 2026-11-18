import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ACHROMATIC_CHROMA, BASELINE_SEED, CONTRASTS, ROLES, VARIANTS, decodeScheme, generatedTheme, gridSeeds, harmonize, nearest,
  precomputed, renderTheme, scheme, writeTheme,
} from '../index.mjs';
import { DynamicScheme, Hct, MaterialDynamicColors, Variant, argbFromHex, customColor, hexFromArgb } from '../mcu.mjs';
import { hsl, minChromaticRgbRange } from '../../../../../../tools/build/precompute-schemes.mjs';
import { verify } from '../../verify/index.mjs';

const INDEX = fileURLToPath(new URL('../index.mjs', import.meta.url));
const REPO = fileURLToPath(new URL('../../../../../../', import.meta.url));
const PRECOMPUTED = fileURLToPath(new URL('../../../tokens/precomputed-schemes.json', import.meta.url));

const kebab = s => s.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
const hue = hex => Hct.fromInt(argbFromHex(hex)).hue;
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

function tmp(label) {
  return mkdtempSync(join(tmpdir(), `m3 color ${label} `));
}

// ---------------------------------------------------------------------------------------------
// R13: the baseline seed is the published scheme; any other seed is MCU 2025 output.

const merged = JSON.parse(readFileSync(join(REPO, 'knowledge/tokens/merged.json'), 'utf8'));
function published(mode) {
  const byId = new Map(merged.filter(e => e.mode === mode || e.id.startsWith('md.ref.palette.')).map(e => [e.id, e]));
  const resolve = id => {
    const w = byId.get(id).perPlatform.web;
    return w.hex ? w.hex.slice(0, 7).toLowerCase() : resolve(w.ref);
  };
  return Object.fromEntries(ROLES.map(r => [r, resolve(`md.sys.color.${kebab(r)}`)]));
}

const MODES = [[0, ''], [0.5, '-medium-contrast'], [1, '-high-contrast']];

test('baseline seed: scheme() equals the published md.sys.color tokens in all six modes', () => {
  assert.equal(BASELINE_SEED, '#6750A4');
  for (const dark of [false, true]) {
    for (const [contrast, suffix] of MODES) {
      const mode = `${dark ? 'dark' : 'light'}${suffix}`;
      assert.deepEqual(scheme({ seed: '#6750a4', contrast, dark }), published(mode), mode);
    }
  }
});

test('a non-baseline seed equals MCU 0.4.0 output with the 2025 spec', () => {
  const colors = new MaterialDynamicColors();
  for (const [seed, variant, v] of [['#3366CC', 'tonalSpot', Variant.TONAL_SPOT], ['#B5651D', 'vibrant', Variant.VIBRANT],
    ['#6750A4', 'expressive', Variant.EXPRESSIVE]]) {
    for (const dark of [false, true]) {
      for (const contrast of CONTRASTS) {
        const s = new DynamicScheme({ sourceColorHct: Hct.fromInt(argbFromHex(seed)), variant: v, contrastLevel: contrast, isDark: dark, specVersion: '2025' });
        const want = Object.fromEntries(ROLES.map(r => [r, hexFromArgb(colors[r]().getArgb(s))]));
        assert.deepEqual(scheme({ seed, variant, contrast, dark }), want, `${seed} ${variant} ${dark} ${contrast}`);
      }
    }
  }
});

test('scheme rejects bad input', () => {
  assert.throws(() => scheme({ seed: 'red' }), /seed/);
  assert.throws(() => scheme({ seed: '#123456', variant: 'loud' }), /variant/);
  assert.throws(() => scheme({ seed: '#123456', contrast: 0.3 }), /contrast/);
});

// ---------------------------------------------------------------------------------------------
// Contrast of the on-role pairs.

function luminance(hex) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const PAIRS = [
  ['onPrimary', 'primary'], ['onPrimaryContainer', 'primaryContainer'],
  ['onSecondary', 'secondary'], ['onSecondaryContainer', 'secondaryContainer'],
  ['onTertiary', 'tertiary'], ['onTertiaryContainer', 'tertiaryContainer'],
  ['onError', 'error'], ['onErrorContainer', 'errorContainer'],
  ['onPrimaryFixed', 'primaryFixed'], ['onPrimaryFixedVariant', 'primaryFixed'],
  ['onSecondaryFixed', 'secondaryFixed'], ['onSecondaryFixedVariant', 'secondaryFixed'],
  ['onTertiaryFixed', 'tertiaryFixed'], ['onTertiaryFixedVariant', 'tertiaryFixed'],
  ['onSurface', 'surface'], ['onSurfaceVariant', 'surface'], ['onBackground', 'background'],
  ['onSurface', 'surfaceContainerHighest'], ['onSurfaceVariant', 'surfaceContainerHighest'],
  ['inverseOnSurface', 'inverseSurface'],
];

// Read from the precomputed file (equal to scheme() output: next tests and the CI --check).
test('every on-role pair reaches 4.5:1 at standard contrast, for every precomputed scheme', () => {
  const p = precomputed();
  const low = [];
  let n = 0;
  for (const { seed } of p.seeds) {
    for (const variant of VARIANTS) {
      for (const dark of [false, true]) {
        const s = decodeScheme(p.schemes[seed][variant][dark ? 'dark' : 'light'][0]);
        for (const [on, bg] of PAIRS) {
          n++;
          const r = ratio(s[on], s[bg]);
          if (r < 4.5) low.push(`${seed} ${variant} ${dark ? 'dark' : 'light'} ${on}/${bg} ${r.toFixed(2)}`);
        }
      }
    }
  }
  assert.ok(n > 25000);
  assert.deepEqual(low, []);
});

// ---------------------------------------------------------------------------------------------
// Precomputed grid and nearest.

test('the precomputed grid: baseline + 24 hues x chroma 24/48/72, all variants, 2 x 3 modes', () => {
  const p = precomputed();
  assert.deepEqual(p.roles, ROLES);
  assert.deepEqual(p.variants, VARIANTS);
  assert.deepEqual(p.contrasts, CONTRASTS);
  assert.equal(VARIANTS.length, 9);
  assert.equal(p.seeds.length, 73);
  assert.equal(p.seeds[0].seed, BASELINE_SEED);
  assert.equal(p.seeds[0].source, 'baseline');
  const grid = p.seeds.slice(1);
  assert.deepEqual([...new Set(grid.map(s => s.hue))], Array.from({ length: 24 }, (_, i) => i * 15));
  for (const h of new Set(grid.map(s => s.hue))) assert.deepEqual(grid.filter(s => s.hue === h).map(s => s.chroma), [24, 48, 72]);
  assert.equal(new Set(p.seeds.map(s => s.seed)).size, 73, 'seeds are distinct');
  assert.deepEqual(gridSeeds(), p.seeds.map(s => s.seed));
  for (const s of p.seeds) {
    for (const v of VARIANTS) {
      assert.equal(p.schemes[s.seed][v].light.length, 3);
      assert.equal(p.schemes[s.seed][v].dark.length, 3);
      for (const str of [...p.schemes[s.seed][v].light, ...p.schemes[s.seed][v].dark]) assert.equal(str.length, ROLES.length * 6);
    }
  }
});

test('#B5651D and #2F6F5E are not grid seeds', () => {
  const seeds = new Set(gridSeeds().map(s => s.toUpperCase()));
  assert.equal(seeds.has('#B5651D'), false);
  assert.equal(seeds.has('#2F6F5E'), false);
});

// A sample (every 12th seed, plus the baseline); the full comparison is the CI step
// node tools/build/precompute-schemes.mjs --check (about 30 s).
test('precomputed schemes equal scheme() (sampled seeds, every variant and mode)', () => {
  const p = precomputed();
  for (const { seed } of p.seeds.filter((_, i) => i % 12 === 0)) {
    for (const variant of VARIANTS) {
      for (const dark of [false, true]) {
        CONTRASTS.forEach((contrast, i) => {
          const str = p.schemes[seed][variant][dark ? 'dark' : 'light'][i];
          const fromFile = Object.fromEntries(ROLES.map((r, k) => [r, `#${str.slice(k * 6, k * 6 + 6)}`]));
          assert.deepEqual(fromFile, scheme({ seed, variant, contrast, dark }), `${seed} ${variant}`);
        });
      }
    }
  }
});

test('nearest picks by hue, then chroma, deterministically', () => {
  const a = nearest('#B5651D');
  const b = nearest('#b5651d');
  assert.deepEqual(a, b);
  assert.ok(gridSeeds().includes(a.seed));
  // #B5651D: HCT hue ~55.7 -> grid hue 60; chroma ~47.8 -> grid chroma 48.
  assert.equal(a.hue, 60);
  assert.equal(a.chroma, 48);
  const c = nearest('#2F6F5E');
  assert.equal(c.hue, 180);
  assert.equal(c.chroma, 24);
  assert.deepEqual(nearest(BASELINE_SEED), { seed: BASELINE_SEED, hue: precomputed().seeds[0].hue, chroma: precomputed().seeds[0].chroma });
  assert.throws(() => nearest('#12'), /seed/);
});

test('the precomputed file is at most 1.5 MB', () => {
  assert.ok(statSync(PRECOMPUTED).size <= 1.5 * 1024 * 1024, `${statSync(PRECOMPUTED).size} bytes`);
});

// ---------------------------------------------------------------------------------------------
// Theme files.

test('web theme: header, light/dark via prefers-color-scheme and data-theme, medium/high contrast', () => {
  const t = renderTheme({ platform: 'web', seed: '#3366cc', variant: 'tonalSpot' });
  const lines = t.split('\n');
  assert.equal(lines[0], '/* material3 skill generated: color #3366CC tonalSpot */');
  assert.match(t, /material-color-utilities 0\.4\.0, spec 2025/);
  for (const sel of [
    ':root {', '@media (prefers-color-scheme: dark) {', ':root:not([data-theme="light"]) {', ':root[data-theme="dark"] {',
    ':root[data-contrast="medium"] {', ':root[data-contrast="high"] {',
    ':root[data-contrast="medium"]:not([data-theme="light"]) {', ':root[data-theme="dark"][data-contrast="high"] {',
  ]) assert.ok(t.includes(sel), sel);
  const s = scheme({ seed: '#3366CC', variant: 'tonalSpot', contrast: 1, dark: true });
  assert.ok(t.includes(`--md-sys-color-on-primary-container: ${s.onPrimaryContainer};`));
  assert.equal((t.match(/--md-sys-color-primary:/g) || []).length, 9); // (light, dark in media, dark by attribute) x 3 contrast levels
  // Audit keywords (ruling R8), assembled so that this file does not contain them either.
  for (const w of [['m3', 'forge'].join('-'), ['hold', 'out'].join(''), ['reference', 'screenshots'].join('-')]) assert.ok(!t.includes(w), w);
});

test('web theme: color-scheme follows the theme (light, dark by media query and by attribute)', () => {
  const t = renderTheme({ platform: 'web', seed: '#3366cc', variant: 'tonalSpot' });
  const [light, media, attr] = t.split('\n\n').slice(0, 3);
  assert.match(light, /^:root \{\n  color-scheme: light;/m);
  assert.match(media, /:root:not\(\[data-theme="light"\]\) \{\n    color-scheme: dark;/);
  assert.match(attr, /:root\[data-theme="dark"\] \{\n  color-scheme: dark;/);
});

test('baseline theme says it uses the published scheme', () => {
  const t = renderTheme({ platform: 'web', seed: '#6750A4', variant: 'tonalSpot' });
  assert.equal(t.split('\n')[1], '/* source: published baseline scheme (md.sys.color) */');
  const r = renderTheme({ platform: 'web', seed: '#6750A4', variant: 'vibrant' });
  assert.equal(r.split('\n')[1], '/* source: material-color-utilities 0.4.0, spec 2025 */');
  // Variants without a 2025 spec in MCU 0.4.0 fall back to its 2021 spec, and the header says so.
  const f = renderTheme({ platform: 'web', seed: '#6750A4', variant: 'fidelity' });
  assert.equal(f.split('\n')[1], '/* source: material-color-utilities 0.4.0, spec 2021 */');
});

test('Flutter and Compose theme files: ColorScheme constants and light/darkColorScheme', () => {
  const d = renderTheme({ platform: 'flutter', seed: '#3366CC', variant: 'tonalSpot' });
  assert.equal(d.split('\n')[0], '// material3 skill generated: color #3366CC tonalSpot');
  assert.match(d, /^import 'package:flutter\/material\.dart';$/m);
  for (const n of ['light', 'lightMediumContrast', 'lightHighContrast', 'dark', 'darkMediumContrast', 'darkHighContrast']) {
    assert.match(d, new RegExp(`static const ColorScheme ${n} = ColorScheme\\(`));
  }
  assert.match(d, /onInverseSurface: Color\(0xFF[0-9A-F]{6}\),/);
  assert.doesNotMatch(d, /\b(?:background|onBackground|surfaceVariant):/, 'deprecated Flutter roles are left out');
  const dm = renderTheme({ platform: 'flutter', seed: '#3366CC', variant: 'tonalSpot', flutterLibrary: 'material_ui' });
  assert.match(dm, /^import 'package:material_ui\/material_ui\.dart';$/m);

  const k = renderTheme({ platform: 'compose', seed: '#3366CC', variant: 'tonalSpot' });
  assert.match(k, /^package m3\.theme$/m);
  assert.match(k, /^val M3LightColorScheme = lightColorScheme\($/m);
  assert.match(k, /^val M3DarkHighContrastColorScheme = darkColorScheme\($/m);
  assert.doesNotMatch(k, /\bshadow =/);
  assert.match(renderTheme({ platform: 'compose', seed: '#3366CC', variant: 'tonalSpot', packageName: 'com.example.app' }), /^package com\.example\.app\.theme$/m);
});

test('--custom: harmonized toward the seed, emitted as four extra roles on every platform', () => {
  const seed = '#3366CC';
  const brand = '#B5651D';
  const t = renderTheme({ platform: 'web', seed, variant: 'tonalSpot', custom: { brand } });
  assert.equal(t.split('\n')[1], '/* custom: brand=#B5651D */');
  const values = [...t.matchAll(/--md-sys-color-brand: (#[0-9a-f]{6});/g)].map(m => m[1]);
  assert.equal(values.length, 9);
  for (const v of values) assert.ok(hueDist(hue(v), hue(seed)) < hueDist(hue(brand), hue(seed)) - 5, `${v} moved toward the seed`);
  // The values are MCU's own customColor (utils/theme_utils) output, light/dark; MCU has no contrast
  // levels for custom colors, so every contrast block repeats them.
  const cc = customColor(argbFromHex(seed), { value: argbFromHex(brand), name: 'brand', blend: true });
  assert.equal(hexFromArgb(cc.value), harmonize(brand, seed));
  const want = {
    light: [cc.light.color, cc.light.onColor, cc.light.colorContainer, cc.light.onColorContainer].map(hexFromArgb),
    dark: [cc.dark.color, cc.dark.onColor, cc.dark.colorContainer, cc.dark.onColorContainer].map(hexFromArgb),
  };
  const blocks = t.split('\n\n'); // per contrast level: light, dark (media query), dark (data-theme)
  assert.equal(blocks.length, 9);
  blocks.forEach((b, i) => {
    const got = ['brand', 'on-brand', 'brand-container', 'on-brand-container'].map(r => new RegExp(`--md-sys-color-${r}: (#[0-9a-f]{6});`).exec(b)[1]);
    assert.deepEqual(got, i % 3 === 0 ? want.light : want.dark, `block ${i}`);
  });
  const d = renderTheme({ platform: 'flutter', seed, variant: 'tonalSpot', custom: { brand } });
  assert.match(d, /class M3CustomColors extends ThemeExtension<M3CustomColors>/);
  assert.match(d, /final Color onBrandContainer;/);
  const k = renderTheme({ platform: 'compose', seed, variant: 'tonalSpot', custom: { brand } });
  assert.match(k, /data class M3CustomColors\(/);
  assert.match(k, /^val M3DarkCustomColors = M3CustomColors\($/m);
  assert.throws(() => renderTheme({ platform: 'web', seed, custom: { primary: brand } }), /custom/);
  assert.throws(() => renderTheme({ platform: 'web', seed, custom: { 'my-brand': brand } }), /custom/);
  assert.throws(() => renderTheme({ platform: 'web', seed, custom: { brand: 'orange' } }), /custom/);
});

test('writeTheme and the CLI write the file (path with spaces) and report the seed and source', () => {
  const dir = tmp('cli');
  try {
    const out = join(dir, 'lib dir', 'm3', 'schemes.dart');
    const r = writeTheme({ platform: 'flutter', seed: '#3366cc', variant: 'tonalSpot', out });
    assert.deepEqual(r, { seedRequested: '#3366cc', seedUsed: '#3366CC', exact: true, source: 'material-color-utilities 0.4.0, spec 2025', out });
    assert.equal(readFileSync(out, 'utf8'), renderTheme({ platform: 'flutter', seed: '#3366CC', variant: 'tonalSpot' }));

    const css = join(dir, 'web out', 'colors.css');
    const p = spawnSync(process.execPath, [INDEX, '--seed', '#6750A4', '--platform', 'web', '--out', css, '--custom', 'brand=#B5651D', '--custom', 'ok=#2F6F5E'], { encoding: 'utf8' });
    assert.equal(p.status, 0, p.stderr);
    const j = JSON.parse(p.stdout);
    assert.equal(j.seedUsed, '#6750A4');
    assert.equal(j.source, 'published baseline scheme (md.sys.color)');
    assert.equal(readFileSync(css, 'utf8'), renderTheme({ platform: 'web', seed: '#6750A4', variant: 'tonalSpot', custom: { brand: '#B5651D', ok: '#2F6F5E' } }));

    const n = spawnSync(process.execPath, [INDEX, '--nearest', '#B5651D'], { encoding: 'utf8' });
    assert.equal(n.status, 0, n.stderr);
    assert.deepEqual(JSON.parse(n.stdout), nearest('#B5651D'));

    const bad = spawnSync(process.execPath, [INDEX, '--seed', 'nope', '--platform', 'web', '--out', css], { encoding: 'utf8' });
    assert.equal(bad.status, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('writeTheme and the CLI refuse to overwrite a user file; a re-run over the own output works', () => {
  const dir = tmp('overwrite');
  try {
    const out = join(dir, 'ui theme', 'Color.kt');
    mkdirSync(join(dir, 'ui theme'), { recursive: true });
    const mine = ['package x', 'val Purple80 = Color(0xFFD0BCFF)', ''].join('\n');
    writeFileSync(out, mine);
    assert.throws(() => writeTheme({ platform: 'compose', seed: '#6750A4', out, packageName: 'com.x' }), e => e.code === 'EEXIST_USER_FILE');
    const p = spawnSync(process.execPath, [INDEX, '--seed', '#6750A4', '--platform', 'compose', '--out', out], { encoding: 'utf8' });
    assert.equal(p.status, 3);
    assert.match(p.stderr, /Color\.kt/);
    assert.equal(readFileSync(out, 'utf8'), mine);
    const free = join(dir, 'ui theme', 'M3Color.kt');
    assert.equal(spawnSync(process.execPath, [INDEX, '--seed', '#6750A4', '--platform', 'compose', '--out', free], { encoding: 'utf8' }).status, 0);
    const again = spawnSync(process.execPath, [INDEX, '--seed', '#2F6F5E', '--platform', 'compose', '--out', free], { encoding: 'utf8' });
    assert.equal(again.status, 0, again.stderr);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---------------------------------------------------------------------------------------------
// Verify treats a generated file as a theme file only when it is exactly what the script writes.

test('generatedTheme accepts exact output (any package / library choice) and rejects edits', () => {
  const k = renderTheme({ platform: 'compose', seed: '#3366CC', variant: 'vibrant', custom: { brand: '#B5651D' }, packageName: 'com.example.app' });
  assert.equal(generatedTheme('app/src/main/java/com/example/app/theme/Color.kt', k), 'color #3366CC vibrant');
  const d = renderTheme({ platform: 'flutter', seed: '#3366CC', variant: 'tonalSpot', flutterLibrary: 'material_ui' });
  assert.equal(generatedTheme('lib/m3/schemes.dart', d), 'color #3366CC tonalSpot');
  assert.equal(generatedTheme('lib/m3/schemes.dart', d.replace(/0xFF[0-9A-F]{6}/, '0xFF123456')), null);
  assert.equal(generatedTheme('lib/m3/schemes.dart', `${d}\nconst x = Color(0xFF123456);\n`), null);
  assert.equal(generatedTheme('lib/m3/schemes.css', d), null, 'platform comes from the extension');
  assert.equal(generatedTheme('a.css', '/* material3 skill generated: color #3366CC tonalSpot */\n:root { --x: #123456; }\n'), null);
});

const PROJECTS = {
  web: { file: 'src/styles/colors.css', ui: ['src/app.css', '.card { color: #123456; }\n'] },
  flutter: { file: 'lib/m3/schemes.dart', ui: ['lib/main.dart', "import 'package:flutter/material.dart';\nconst c = Color(0xFF123456);\n"] },
  compose: {
    // Not Color.kt: verify already treats a file named Color.kt as a theme file by its name.
    file: 'app/src/main/java/com/example/app/theme/M3Colors.kt',
    ui: ['app/src/main/java/com/example/app/Ui.kt', 'package com.example.app\n\nimport androidx.compose.ui.graphics.Color\n\nval c = Color(0xFF123456)\n'],
  },
};

for (const [platform, { file, ui }] of Object.entries(PROJECTS)) {
  test(`${platform}: verify allowlists the generated color file; a spoofed header is not enough`, async () => {
    const dir = tmp(`verify ${platform}`);
    try {
      const put = (rel, text) => { mkdirSync(join(dir, rel, '..'), { recursive: true }); writeFileSync(join(dir, rel), text); };
      writeTheme({ platform, seed: '#3366CC', variant: 'tonalSpot', custom: { brand: '#B5651D' }, packageName: 'com.example.app', out: join(dir, file) });
      put(...ui);
      const r = await verify({ projectDir: dir, platform });
      const entry = r.allowlisted.find(a => a.file === file);
      assert.ok(entry, `${file} allowlisted`);
      assert.equal(entry.reason, 'material3 skill generated theme (color #3366CC tonalSpot)');
      assert.ok(Object.values(entry.suppressed).reduce((a, b) => a + b, 0) > 0);
      assert.equal(r.violations.filter(v => v.file === file).length, 0);
      assert.equal(r.violations.filter(v => v.file === ui[0] && v.check === 'hardcoded-color').length, 1);

      // Same header, one extra literal: no longer the generated file, so it is scanned like UI code.
      const text = readFileSync(join(dir, file), 'utf8');
      const extra = platform === 'web' ? '.x { color: #654321; }\n' : platform === 'flutter' ? 'const y = Color(0xFF654321);\n' : 'val y = Color(0xFF654321)\n';
      put(file, text + extra);
      const s = await verify({ projectDir: dir, platform });
      assert.equal(s.allowlisted.find(a => a.file === file && /generated theme/.test(a.reason)), undefined);
      assert.ok(s.violations.some(v => v.file === file && v.check === 'hardcoded-color'));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

// ---------------------------------------------------------------------------------------------
// Achromatic seeds and the no-Node nearest rule.

test('an achromatic seed (HCT chroma < 12) uses the baseline seed, on every path', () => {
  assert.equal(ACHROMATIC_CHROMA, 12);
  for (const gray of ['#808080', '#000000', '#FFFFFF', '#1C1B1F']) {
    assert.ok(Hct.fromInt(argbFromHex(gray)).chroma < 12, gray);
    const n = nearest(gray);
    assert.deepEqual(n, { seed: BASELINE_SEED, hue: precomputed().seeds[0].hue, chroma: precomputed().seeds[0].chroma, note: 'achromatic seed, baseline used' });
  }
  const dir = tmp('achromatic');
  try {
    const out = join(dir, 'colors.css');
    const r = writeTheme({ platform: 'web', seed: '#222222', variant: 'tonalSpot', out });
    assert.deepEqual(r, { seedRequested: '#222222', seedUsed: BASELINE_SEED, exact: false, source: 'published baseline scheme (md.sys.color)', out, note: 'achromatic seed, baseline used' });
    const text = readFileSync(out, 'utf8');
    const lines = text.split('\n');
    assert.equal(lines[0], '/* material3 skill generated: color #6750A4 tonalSpot */');
    assert.equal(lines[1], '/* requested: #222222 (achromatic seed, baseline used; HCT chroma below 12) */');
    assert.equal(text.slice(text.indexOf(':root {')), renderTheme({ platform: 'web', seed: BASELINE_SEED }).slice(renderTheme({ platform: 'web', seed: BASELINE_SEED }).indexOf(':root {')));
    assert.equal(generatedTheme('colors.css', text), 'color #6750A4 tonalSpot');
    assert.equal(generatedTheme('colors.css', text.replace('#222222', '#3366CC')), null, 'a colorful requested seed does not reproduce this file');
    const k = renderTheme({ platform: 'compose', seed: '#222222', custom: { brand: '#B5651D' } });
    assert.equal(generatedTheme('Color.kt', k), 'color #6750A4 tonalSpot');
  } finally { rmSync(dir, { recursive: true, force: true }); }
  const cli = spawnSync(process.execPath, [INDEX, '--nearest', '#777777'], { encoding: 'utf8' });
  assert.equal(JSON.parse(cli.stdout).note, 'achromatic seed, baseline used');
});

// What a model without Node does with the file: the rule text and the per-seed HSL values.
function noNodeNearest(p, hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  if (Math.max(r, g, b) - Math.min(r, g, b) < p.nearest.rgbRange) return p.seeds[0].seed;
  const { hslHue, hslSat } = hsl(hex);
  const d = (a, c) => { const x = Math.abs(a - c); return x > 180 ? 360 - x : x; };
  return p.seeds.map((s, i) => ({ s, i, dh: d(hslHue, s.hslHue), ds: Math.abs(hslSat - s.hslSat) }))
    .sort((a, c) => a.dh - c.dh || a.ds - c.ds || a.i - c.i)[0].s.seed;
}

test('the file states the no-Node nearest rule and carries HSL hue/saturation per seed', () => {
  const p = precomputed();
  for (const key of ['achromatic', 'withoutNode', 'withNode']) assert.equal(typeof p.nearest[key], 'string', key);
  assert.match(p.nearest.achromatic, /HCT chroma is below 12/);
  assert.match(p.nearest.achromatic, /achromatic seed, baseline used/);
  assert.equal(p.nearest.rgbRange, minChromaticRgbRange());
  assert.ok(p.nearest.achromatic.includes(`< ${p.nearest.rgbRange} `));
  assert.match(p.nearest.withoutNode, /HSL hue .* then the smallest \|saturation - hslSat\|, then the earliest in the seeds list/);
  for (const s of p.seeds) {
    // Independent HSL computation (not the build tool's).
    const [r, g, b] = [1, 3, 5].map(i => parseInt(s.seed.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const l = (mx + mn) / 2;
    const sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
    assert.ok(Math.abs(s.hslSat - sat * 100) <= 0.05 + 1e-9, s.seed);
    assert.deepEqual({ hslHue: s.hslHue, hslSat: s.hslSat }, hsl(s.seed));
  }
  // The rule gives a deterministic grid seed, and a gray gives the baseline.
  assert.equal(noNodeNearest(p, '#B5651D'), noNodeNearest(p, '#B5651D'));
  assert.ok(gridSeeds().includes(noNodeNearest(p, '#B5651D')));
  assert.equal(noNodeNearest(p, '#808080'), BASELINE_SEED);
  // Every grid seed is its own nearest seed under the rule, unless an earlier seed has the very same
  // HSL hue and saturation (HSL cannot tell them apart; today one pair: #00A0C7 and #06CEFF).
  for (const s of p.seeds.slice(1)) {
    const got = noNodeNearest(p, s.seed);
    if (got === s.seed) continue;
    const other = p.seeds.find(x => x.seed === got);
    assert.deepEqual([other.hslHue, other.hslSat], [s.hslHue, s.hslSat], `${s.seed} -> ${got}`);
    assert.ok(p.seeds.indexOf(other) < p.seeds.indexOf(s));
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BASELINE_SEED, CONTRASTS, ROLES, VARIANTS, decodeScheme, generatedTheme, gridSeeds, nearest, precomputed, renderTheme,
  scheme, writeTheme,
} from '../index.mjs';
import { DynamicScheme, Hct, MaterialDynamicColors, Variant, argbFromHex, hexFromArgb } from '../mcu.mjs';
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
  for (const role of ['on-brand', 'brand-container', 'on-brand-container']) assert.match(t, new RegExp(`--md-sys-color-${role}: #`));
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

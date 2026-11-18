#!/usr/bin/env node
// Color script of the material3 skill: Material 3 color schemes from a seed color, written into a
// platform theme file. Uses the vendored material-color-utilities 0.4.0. The style picks the MCU color
// spec (owner, 2026-11-18): M3 Expressive uses the 2025 spec, classic M3 the 2021 spec. One scheme
// always comes from one spec, so the error roles are never mixed between specs.
//
//   scheme({ seed, variant = 'tonalSpot', contrast = 0, dark = false, spec = '2025' }) -> { role: '#rrggbb' }
//   renderTheme({ platform, seed, variant, style, custom, packageName, flutterLibrary }) -> file text
//   writeTheme({ platform, seed, variant, style, out, custom, packageName, flutterLibrary })
//     -> { seedRequested, seedUsed, exact, style, source, out, note? }
//   nearest(seedHex) -> { seed, hue, chroma, note? }   nearest precomputed seed: by HCT hue, then chroma
// An achromatic seed (HCT chroma below 12, half the lowest grid chroma) is replaced by the baseline
// seed: writeTheme reports exact: false and note 'achromatic seed, baseline used', and the theme
// header names the requested seed.
//   generatedTheme(relPath, text) -> 'color <seed> <variant>' | null   (used by verify)
//
// CLI:
//   node index.mjs --seed #hex [--variant v] [--style expressive|classic] --platform web|flutter|compose
//                  --out file [--custom name=#hex]... [--package com.example.app] [--flutter-library material|material_ui]
//   node index.mjs --nearest #hex
// Prints JSON. Exit code 0 on success, 2 on bad usage or input.
//
// The baseline seed #6750A4 with tonalSpot gives the published baseline scheme (md.sys.color, all six
// modes, stored in tokens/precomputed-schemes.json) in both styles; every other seed/variant is MCU
// output in the style's spec. Variants MCU defines only in the 2021 spec use it in both styles.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Blend, DynamicScheme, Hct, MaterialDynamicColors, Variant, argbFromHex, customColor, hexFromArgb } from './mcu.mjs';

export const BASELINE_SEED = '#6750A4';
export const MCU_VERSION = '0.4.0';
export const SPEC_VERSION = '2025';
// Style -> MCU color spec.
export const STYLE_SPECS = { expressive: '2025', classic: '2021' };
export const STYLES = Object.keys(STYLE_SPECS);
export const SPECS = Object.values(STYLE_SPECS);
export const CONTRASTS = [0, 0.5, 1];
export const PLATFORMS = ['web', 'flutter', 'compose'];
// Chroma levels of the precomputed grid. A seed whose HCT chroma is below half the lowest level is
// achromatic (gray, near black, near white): the baseline seed is used instead.
export const GRID_CHROMAS = [24, 48, 72];
export const ACHROMATIC_CHROMA = Math.min(...GRID_CHROMAS) / 2;
export const ACHROMATIC_NOTE = 'achromatic seed, baseline used';

export function isAchromatic(seed) {
  return Hct.fromInt(argbFromHex(normalizeSeed(seed))).chroma < ACHROMATIC_CHROMA;
}

// MCU variants, as named in the color reference (knowledge color-system variants).
const VARIANT_IDS = {
  monochrome: Variant.MONOCHROME,
  neutral: Variant.NEUTRAL,
  tonalSpot: Variant.TONAL_SPOT,
  vibrant: Variant.VIBRANT,
  expressive: Variant.EXPRESSIVE,
  fidelity: Variant.FIDELITY,
  content: Variant.CONTENT,
  rainbow: Variant.RAINBOW,
  fruitSalad: Variant.FRUIT_SALAD,
};
export const VARIANTS = Object.keys(VARIANT_IDS);

// Color roles (MaterialDynamicColors names). CSS: --md-sys-color-<kebab>.
export const ROLES = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer', 'inversePrimary',
  'primaryFixed', 'primaryFixedDim', 'onPrimaryFixed', 'onPrimaryFixedVariant',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'secondaryFixed', 'secondaryFixedDim', 'onSecondaryFixed', 'onSecondaryFixedVariant',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'tertiaryFixed', 'tertiaryFixedDim', 'onTertiaryFixed', 'onTertiaryFixedVariant',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'background', 'onBackground', 'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant',
  'surfaceDim', 'surfaceBright', 'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer',
  'surfaceContainerHigh', 'surfaceContainerHighest',
  'inverseSurface', 'inverseOnSurface', 'outline', 'outlineVariant', 'shadow', 'scrim', 'surfaceTint',
];

export class UsageError extends Error {}
export class ExistsError extends Error { code = 'EEXIST_USER_FILE'; }

const PRECOMPUTED_PATH = fileURLToPath(new URL('../../tokens/precomputed-schemes.json', import.meta.url));
let cache = null;
export function precomputed() {
  if (!cache) cache = JSON.parse(readFileSync(PRECOMPUTED_PATH, 'utf8'));
  return cache;
}

export function normalizeSeed(seed) {
  if (typeof seed !== 'string' || !/^#?[0-9a-fA-F]{6}$/.test(seed.trim())) {
    throw new UsageError(`seed must be a #RRGGBB hex color, got ${JSON.stringify(seed)}`);
  }
  return `#${seed.trim().replace('#', '').toUpperCase()}`;
}

function checkVariant(variant) {
  if (!VARIANTS.includes(variant)) throw new UsageError(`variant must be one of ${VARIANTS.join(', ')}; got ${JSON.stringify(variant)}`);
}

function checkSpec(spec) {
  if (!SPECS.includes(spec)) throw new UsageError(`spec must be ${SPECS.join(' or ')}; got ${JSON.stringify(spec)}`);
}

function specOfStyle(style) {
  if (!STYLES.includes(style)) throw new UsageError(`style must be ${STYLES.join(' or ')}; got ${JSON.stringify(style)}`);
  return STYLE_SPECS[style];
}

// The spec MCU actually uses for a variant (2021 for variants without a 2025 definition).
export function effectiveSpec(variant, spec = SPEC_VERSION) {
  return DynamicScheme.maybeFallbackSpecVersion(spec, VARIANT_IDS[variant]);
}

function checkContrast(contrast) {
  if (!CONTRASTS.includes(contrast)) throw new UsageError(`contrast must be 0, 0.5 or 1; got ${JSON.stringify(contrast)}`);
}

const colors = new MaterialDynamicColors();

function dynamicScheme(seed, variant, contrast, dark, spec, palettes = {}) {
  return new DynamicScheme({
    sourceColorHct: Hct.fromInt(argbFromHex(seed)),
    variant: VARIANT_IDS[variant],
    contrastLevel: contrast,
    isDark: dark,
    specVersion: spec,
    ...palettes,
  });
}

// MCU output; the spec version is what MCU uses for the variant (2021 for variants without a 2025 spec).
export function mcuScheme({ seed, variant = 'tonalSpot', contrast = 0, dark = false, spec = SPEC_VERSION }) {
  checkSpec(spec);
  const s = dynamicScheme(normalizeSeed(seed), variant, contrast, dark, spec);
  return { roles: Object.fromEntries(ROLES.map(r => [r, hexFromArgb(colors[r]().getArgb(s))])), specVersion: s.specVersion };
}

const isPublished = (seed, variant) => seed === BASELINE_SEED && variant === 'tonalSpot';

export function sourceOf(seed, variant, spec = SPEC_VERSION) {
  if (isPublished(normalizeSeed(seed), variant)) return 'published baseline scheme (md.sys.color)';
  return `material-color-utilities ${MCU_VERSION}, spec ${effectiveSpec(variant, spec)}`;
}

export function decodeScheme(str) {
  return Object.fromEntries(precomputed().roles.map((r, k) => [r, `#${str.slice(k * 6, k * 6 + 6)}`]));
}

export function scheme({ seed, variant = 'tonalSpot', contrast = 0, dark = false, spec = SPEC_VERSION } = {}) {
  const s = normalizeSeed(seed);
  checkVariant(variant);
  checkContrast(contrast);
  checkSpec(spec);
  if (isPublished(s, variant)) {
    const p = precomputed();
    return decodeScheme(p.schemes[s][variant][dark ? 'dark' : 'light'][p.contrasts.indexOf(contrast)]);
  }
  return mcuScheme({ seed: s, variant, contrast, dark, spec }).roles;
}

// ---------------------------------------------------------------------------------------------
// Custom colors: MCU's own customColor (utils/theme_utils): the color is harmonized with the seed
// (Blend.harmonize) and its four roles are fixed tones of the harmonized color's palette (light
// 40/100/90/10, dark 80/20/30/90). MCU defines no contrast levels for custom colors, so the medium and
// high contrast schemes carry the same custom values as the standard one.

const cap = s => s[0].toUpperCase() + s.slice(1);
const customRoles = name => [name, `on${cap(name)}`, `${name}Container`, `on${cap(name)}Container`];

function checkCustom(custom) {
  const entries = Object.entries(custom || {});
  const taken = new Set(ROLES);
  for (const [name, hex] of entries) {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) throw new UsageError(`custom color name must be camelCase letters and digits: ${name}`);
    if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) throw new UsageError(`custom color ${name} must be #RRGGBB, got ${JSON.stringify(hex)}`);
    for (const r of customRoles(name)) {
      if (taken.has(r)) throw new UsageError(`custom color ${name}: role ${r} already exists`);
      taken.add(r);
    }
  }
  return entries.map(([name, hex]) => [name, normalizeSeed(hex)]);
}

export function harmonize(hex, seed) {
  return hexFromArgb(Blend.harmonize(argbFromHex(hex), argbFromHex(seed)));
}

function customRolesFor(name, hex, seed, dark) {
  const cc = customColor(argbFromHex(seed), { value: argbFromHex(hex), name, blend: true });
  const g = dark ? cc.dark : cc.light;
  const [n, on, c, onC] = customRoles(name);
  return {
    [n]: hexFromArgb(g.color),
    [on]: hexFromArgb(g.onColor),
    [c]: hexFromArgb(g.colorContainer),
    [onC]: hexFromArgb(g.onColorContainer),
  };
}

// ---------------------------------------------------------------------------------------------
// Rendering.

const MODES = [
  { dark: false, contrast: 0, name: 'light' },
  { dark: false, contrast: 0.5, name: 'lightMediumContrast' },
  { dark: false, contrast: 1, name: 'lightHighContrast' },
  { dark: true, contrast: 0, name: 'dark' },
  { dark: true, contrast: 0.5, name: 'darkMediumContrast' },
  { dark: true, contrast: 1, name: 'darkHighContrast' },
];

const kebab = s => s.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
const argbLiteral = hex => `Color(0xFF${hex.slice(1).toUpperCase()})`;

const NOTE = 'Written by the material3 skill color script (scripts/color). Rerun it to change the scheme; edits are not kept.';
const FLUTTER_IMPORTS = {
  material: "import 'package:flutter/material.dart';",
  material_ui: "import 'package:material_ui/material_ui.dart';",
};
const DEFAULT_THEME_PACKAGE = 'm3.theme';

function headerLines(seed, variant, custom, requested, spec) {
  const out = [`material3 skill generated: color ${seed} ${variant}`];
  if (requested !== seed) out.push(`requested: ${requested} (${ACHROMATIC_NOTE}; HCT chroma below ${ACHROMATIC_CHROMA})`);
  if (custom.length) out.push(`custom: ${custom.map(([n, h]) => `${n}=${h}`).join(', ')}`);
  out.push(`source: ${sourceOf(seed, variant, spec)}`);
  out.push(NOTE);
  return out;
}

function modeValues(seed, variant, custom, spec) {
  return MODES.map(m => {
    const roles = scheme({ seed, variant, contrast: m.contrast, dark: m.dark, spec });
    const extra = Object.assign({}, ...custom.map(([n, h]) => customRolesFor(n, h, seed, m.dark)));
    return { ...m, roles, extra };
  });
}

function renderWeb({ seed, variant, custom, modes, requested, spec }) {
  const lines = headerLines(seed, variant, custom, requested, spec).map(l => `/* ${l} */`);
  const decls = (m, indent) => [...Object.entries(m.roles), ...Object.entries(m.extra)]
    .map(([r, v]) => `${indent}--md-sys-color-${kebab(r)}: ${v};`);
  // color-scheme makes native controls (date pickers, scrollbars) follow the theme.
  const block = (sel, m, cs) => [`${sel} {`, ...(cs ? [`  color-scheme: ${cs};`] : []), ...decls(m, '  '), '}'];
  const media = (sel, m, cs) => ['@media (prefers-color-scheme: dark) {', `  ${sel} {`, ...(cs ? [`    color-scheme: ${cs};`] : []), ...decls(m, '    '), '  }', '}'];
  const by = name => modes.find(m => m.name === name);
  const parts = [
    block(':root', by('light'), 'light'),
    media(':root:not([data-theme="light"])', by('dark'), 'dark'),
    block(':root[data-theme="dark"]', by('dark'), 'dark'),
  ];
  for (const [c, suffix] of [['medium', 'MediumContrast'], ['high', 'HighContrast']]) {
    parts.push(
      block(`:root[data-contrast="${c}"]`, by(`light${suffix}`)),
      media(`:root[data-contrast="${c}"]:not([data-theme="light"])`, by(`dark${suffix}`)),
      block(`:root[data-theme="dark"][data-contrast="${c}"]`, by(`dark${suffix}`)),
    );
  }
  lines.push('/* Light by default; dark follows prefers-color-scheme unless data-theme="light" or "dark" is set on the root element.');
  lines.push('   data-contrast="medium" or "high" on the root element selects the medium or high contrast scheme. */');
  return `${lines.join('\n')}\n${parts.map(p => p.join('\n')).join('\n\n')}\n`;
}

// Flutter ColorScheme parameters: the deprecated background, onBackground and surfaceVariant are left
// out; inverseOnSurface is onInverseSurface.
const FLUTTER_ROLES = ROLES.filter(r => !['background', 'onBackground', 'surfaceVariant'].includes(r));
const flutterParam = r => (r === 'inverseOnSurface' ? 'onInverseSurface' : r);

function renderFlutter({ seed, variant, custom, modes, flutterLibrary, requested, spec }) {
  const out = headerLines(seed, variant, custom, requested, spec).map(l => `// ${l}`);
  out.push('// With the material_ui package the import is package:material_ui/material_ui.dart (--flutter-library material_ui).');
  out.push(FLUTTER_IMPORTS[flutterLibrary], '');
  out.push(`/// Color schemes for seed ${seed} (${variant}): light and dark at standard, medium and high contrast.`);
  out.push('abstract final class M3ColorSchemes {');
  modes.forEach((m, i) => {
    if (i) out.push('');
    out.push(`  static const ColorScheme ${m.name} = ColorScheme(`);
    out.push(`    brightness: Brightness.${m.dark ? 'dark' : 'light'},`);
    for (const r of FLUTTER_ROLES) out.push(`    ${flutterParam(r)}: ${argbLiteral(m.roles[r])},`);
    out.push('  );');
  });
  out.push('}');
  if (custom.length) {
    const fields = custom.flatMap(([n]) => customRoles(n));
    out.push('', '/// Custom colors, harmonized with the seed. Add to ThemeData.extensions; read with',
      '/// `Theme.of(context).extension<M3CustomColors>()!`.', '@immutable',
      'class M3CustomColors extends ThemeExtension<M3CustomColors> {', '  const M3CustomColors({');
    for (const f of fields) out.push(`    required this.${f},`);
    out.push('  });', '');
    for (const f of fields) out.push(`  final Color ${f};`);
    for (const m of modes) {
      out.push('', `  static const M3CustomColors ${m.name} = M3CustomColors(`);
      for (const f of fields) out.push(`    ${f}: ${argbLiteral(m.extra[f])},`);
      out.push('  );');
    }
    out.push('', '  @override', '  M3CustomColors copyWith({');
    for (const f of fields) out.push(`    Color? ${f},`);
    out.push('  }) {', '    return M3CustomColors(');
    for (const f of fields) out.push(`      ${f}: ${f} ?? this.${f},`);
    out.push('    );', '  }', '', '  @override', '  M3CustomColors lerp(M3CustomColors? other, double t) {',
      '    if (other is! M3CustomColors) return this;', '    return M3CustomColors(');
    for (const f of fields) out.push(`      ${f}: Color.lerp(${f}, other.${f}, t)!,`);
    out.push('    );', '  }', '}');
  }
  return `${out.join('\n')}\n`;
}

// Compose lightColorScheme/darkColorScheme parameters: every role except shadow.
const COMPOSE_ROLES = ROLES.filter(r => r !== 'shadow');

function renderCompose({ seed, variant, custom, modes, themePackage, requested, spec }) {
  const out = headerLines(seed, variant, custom, requested, spec).map(l => `// ${l}`);
  out.push(`// package ${DEFAULT_THEME_PACKAGE} is a placeholder: --package com.example.app writes package com.example.app.theme.`);
  out.push(`package ${themePackage}`, '');
  out.push('import androidx.compose.material3.darkColorScheme', 'import androidx.compose.material3.lightColorScheme');
  if (custom.length) out.push('import androidx.compose.runtime.Immutable');
  out.push('import androidx.compose.ui.graphics.Color', '');
  out.push(`// Color schemes for seed ${seed} (${variant}): light and dark at standard, medium and high contrast.`);
  modes.forEach((m, i) => {
    if (i) out.push('');
    out.push(`val M3${cap(m.name)}ColorScheme = ${m.dark ? 'dark' : 'light'}ColorScheme(`);
    for (const r of COMPOSE_ROLES) out.push(`    ${r} = ${argbLiteral(m.roles[r])},`);
    out.push(')');
  });
  if (custom.length) {
    const fields = custom.flatMap(([n]) => customRoles(n));
    out.push('', '// Custom colors, harmonized with the seed.', '@Immutable', 'data class M3CustomColors(');
    for (const f of fields) out.push(`    val ${f}: Color,`);
    out.push(')');
    for (const m of modes) {
      out.push('', `val M3${cap(m.name)}CustomColors = M3CustomColors(`);
      for (const f of fields) out.push(`    ${f} = ${argbLiteral(m.extra[f])},`);
      out.push(')');
    }
  }
  return `${out.join('\n')}\n`;
}

// The seed a theme is built from: the requested one, or the baseline seed for an achromatic one.
export function seedUsedFor(seed) {
  const s = normalizeSeed(seed);
  return isAchromatic(s) ? BASELINE_SEED : s;
}

export function renderTheme({ platform, seed, variant = 'tonalSpot', style = 'expressive', custom = {}, packageName, themePackage, flutterLibrary = 'material' } = {}) {
  if (!PLATFORMS.includes(platform)) throw new UsageError(`platform must be one of ${PLATFORMS.join(', ')}`);
  const requested = normalizeSeed(seed);
  const s = seedUsedFor(requested);
  checkVariant(variant);
  const spec = specOfStyle(style);
  const c = checkCustom(custom);
  if (!FLUTTER_IMPORTS[flutterLibrary]) throw new UsageError('flutter library must be material or material_ui');
  if (packageName != null && !/^[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*$/.test(packageName)) throw new UsageError(`bad package: ${packageName}`);
  const pkg = themePackage || (packageName ? `${packageName}.theme` : DEFAULT_THEME_PACKAGE);
  const modes = modeValues(s, variant, c, spec);
  const args = { seed: s, variant, custom: c, modes, flutterLibrary, themePackage: pkg, requested, spec };
  return platform === 'web' ? renderWeb(args) : platform === 'flutter' ? renderFlutter(args) : renderCompose(args);
}

export function writeTheme({ platform, seed, variant = 'tonalSpot', style = 'expressive', out, custom, packageName, flutterLibrary } = {}) {
  if (!out) throw new UsageError('out is required');
  const text = renderTheme({ platform, seed, variant, style, custom, packageName, flutterLibrary });
  // Never replace a user's file: only this script's own output may be overwritten (a re-run).
  if (existsSync(out)) {
    let old = null;
    try { old = readFileSync(out, 'utf8'); } catch { /* unreadable: treated as a user file */ }
    if (old === null || !generatedTheme(out, old)) {
      throw new ExistsError(`${out} already exists and is not generated by this script; choose another --out name (for example M3${basename(out)}) and wire it into the existing theme by hand`);
    }
  }
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, text);
  const seedUsed = seedUsedFor(seed);
  const r = { seedRequested: seed, seedUsed, exact: seedUsed === normalizeSeed(seed), style, source: sourceOf(seedUsed, variant, STYLE_SPECS[style]), out };
  if (!r.exact) r.note = ACHROMATIC_NOTE;
  return r;
}

// ---------------------------------------------------------------------------------------------
// Verify: a file is a generated theme file only when it is exactly what renderTheme writes for the
// options its header and its package/import line name.

const HEADER = {
  web: /^\/\* material3 skill generated: color (#[0-9A-F]{6}) (\w+) \*\/$/,
  flutter: /^\/\/ material3 skill generated: color (#[0-9A-F]{6}) (\w+)$/,
  compose: /^\/\/ material3 skill generated: color (#[0-9A-F]{6}) (\w+)$/,
};
const EXT = { css: 'web', dart: 'flutter', kt: 'compose' };

export function generatedTheme(rel, text) {
  const platform = EXT[String(rel).split('.').pop()];
  if (!platform) return null;
  const src = String(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const lines = src.split('\n');
  const m = HEADER[platform].exec(lines[0]);
  if (!m || !VARIANTS.includes(m[2])) return null;
  // An achromatic request is rendered from the requested seed (the renderer swaps in the baseline).
  let next = 1;
  let seed = m[1];
  const rq = /^(?:\/\*|\/\/) requested: (#[0-9A-F]{6}) \(/.exec(lines[next]);
  if (rq) { seed = rq[1]; next++; }
  const custom = {};
  const cm = /^(?:\/\*|\/\/) custom: (.*?)(?: \*\/)?$/.exec(lines[next]);
  if (cm) {
    for (const pair of cm[1].split(', ')) {
      const [n, h] = pair.split('=');
      if (!n || !h || n in custom) return null;
      custom[n] = h;
    }
  }
  // The style is read back from the source line's spec (the published baseline is the same in both).
  const sp = /^(?:\/\*|\/\/) source: .*, spec (2021|2025)(?: \*\/)?$/m.exec(src);
  const opts = { platform, seed, variant: m[2], custom, style: sp && sp[1] === '2021' ? 'classic' : 'expressive' };
  if (platform === 'compose') {
    const p = /^package (\S+)$/m.exec(src);
    if (!p) return null;
    opts.themePackage = p[1];
  }
  if (platform === 'flutter') opts.flutterLibrary = src.includes(FLUTTER_IMPORTS.material_ui) ? 'material_ui' : 'material';
  try {
    return renderTheme(opts) === src ? `color ${m[1]} ${m[2]}` : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------------------------
// Nearest precomputed seed (the no-Node path reads tokens/precomputed-schemes.json the same way).

const hueDistance = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

export function gridSeeds() {
  return precomputed().seeds.map(s => s.seed);
}

export function nearest(seedHex) {
  const hct = Hct.fromInt(argbFromHex(normalizeSeed(seedHex)));
  if (hct.chroma < ACHROMATIC_CHROMA) {
    const b = precomputed().seeds[0];
    return { seed: b.seed, hue: b.hue, chroma: b.chroma, note: ACHROMATIC_NOTE };
  }
  const ranked = precomputed().seeds
    .map((s, i) => ({ s, i, dh: hueDistance(hct.hue, s.hue), dc: Math.abs(hct.chroma - s.chroma) }))
    .sort((a, b) => a.dh - b.dh || a.dc - b.dc || a.i - b.i);
  const { seed, hue, chroma } = ranked[0].s;
  return { seed, hue, chroma };
}

// ---------------------------------------------------------------------------------------------
// CLI.

function parseArgs(argv) {
  const o = { custom: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      if (i + 1 >= argv.length) throw new UsageError(`${a} needs a value`);
      return argv[++i];
    };
    if (a === '--seed') o.seed = val();
    else if (a === '--variant') o.variant = val();
    else if (a === '--style') o.style = val();
    else if (a === '--platform') o.platform = val();
    else if (a === '--out') o.out = val();
    else if (a === '--package') o.packageName = val();
    else if (a === '--flutter-library') o.flutterLibrary = val();
    else if (a === '--nearest') o.nearest = val();
    else if (a === '--custom') {
      const v = val();
      const eq = v.indexOf('=');
      if (eq < 1) throw new UsageError(`--custom needs name=#hex, got ${v}`);
      o.custom[v.slice(0, eq)] = v.slice(eq + 1);
    } else throw new UsageError(`unknown argument: ${a}`);
  }
  return o;
}

const USAGE = 'usage: index.mjs --seed #hex [--variant v] [--style expressive|classic] --platform web|flutter|compose --out file [--custom name=#hex]... '
  + '[--package com.example.app] [--flutter-library material|material_ui]\n       index.mjs --nearest #hex';

function main(argv) {
  try {
    const o = parseArgs(argv);
    if (o.nearest) {
      console.log(JSON.stringify(nearest(o.nearest)));
      return 0;
    }
    if (!o.seed || !o.platform || !o.out) throw new UsageError('--seed, --platform and --out are required');
    console.log(JSON.stringify(writeTheme(o), null, 2));
    return 0;
  } catch (e) {
    if (e instanceof ExistsError) { console.error(e.message); return 3; }
    if (!(e instanceof UsageError)) throw e;
    console.error(`${e.message}\n${USAGE}`);
    return 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));

#!/usr/bin/env node
// Color script of the material3 skill: Material 3 color schemes from a seed color, written into a
// platform theme file. Uses the vendored material-color-utilities 0.4.0 (2025 spec where MCU has it).
//
//   scheme({ seed, variant = 'tonalSpot', contrast = 0, dark = false }) -> { role: '#rrggbb' }
//   renderTheme({ platform, seed, variant, custom, packageName, flutterLibrary }) -> file text
//   writeTheme({ platform, seed, variant, out, custom, packageName, flutterLibrary })
//     -> { seedRequested, seedUsed, exact: true, source, out }
//   nearest(seedHex) -> { seed, hue, chroma }   nearest precomputed seed: by hue, then chroma
//   generatedTheme(relPath, text) -> 'color <seed> <variant>' | null   (used by verify)
//
// CLI:
//   node index.mjs --seed #hex [--variant v] --platform web|flutter|compose --out file
//                  [--custom name=#hex]... [--package com.example.app] [--flutter-library material|material_ui]
//   node index.mjs --nearest #hex
// Prints JSON. Exit code 0 on success, 2 on bad usage or input.
//
// The baseline seed #6750A4 with tonalSpot gives the published baseline scheme (md.sys.color, all six
// modes, stored in tokens/precomputed-schemes.json); every other seed/variant is MCU output.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Blend, DynamicScheme, Hct, MaterialDynamicColors, TonalPalette, Variant, argbFromHex, hexFromArgb } from './mcu.mjs';

export const BASELINE_SEED = '#6750A4';
export const MCU_VERSION = '0.4.0';
export const SPEC_VERSION = '2025';
export const CONTRASTS = [0, 0.5, 1];
export const PLATFORMS = ['web', 'flutter', 'compose'];

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

function checkContrast(contrast) {
  if (!CONTRASTS.includes(contrast)) throw new UsageError(`contrast must be 0, 0.5 or 1; got ${JSON.stringify(contrast)}`);
}

const colors = new MaterialDynamicColors();

function dynamicScheme(seed, variant, contrast, dark, palettes = {}) {
  return new DynamicScheme({
    sourceColorHct: Hct.fromInt(argbFromHex(seed)),
    variant: VARIANT_IDS[variant],
    contrastLevel: contrast,
    isDark: dark,
    specVersion: SPEC_VERSION,
    ...palettes,
  });
}

// MCU output; the spec version is what MCU uses for the variant (2021 for variants without a 2025 spec).
export function mcuScheme({ seed, variant = 'tonalSpot', contrast = 0, dark = false }) {
  const s = dynamicScheme(normalizeSeed(seed), variant, contrast, dark);
  return { roles: Object.fromEntries(ROLES.map(r => [r, hexFromArgb(colors[r]().getArgb(s))])), specVersion: s.specVersion };
}

const isPublished = (seed, variant) => seed === BASELINE_SEED && variant === 'tonalSpot';

export function sourceOf(seed, variant) {
  if (isPublished(normalizeSeed(seed), variant)) return 'published baseline scheme (md.sys.color)';
  return `material-color-utilities ${MCU_VERSION}, spec ${DynamicScheme.maybeFallbackSpecVersion(SPEC_VERSION, VARIANT_IDS[variant])}`;
}

export function decodeScheme(str) {
  return Object.fromEntries(precomputed().roles.map((r, k) => [r, `#${str.slice(k * 6, k * 6 + 6)}`]));
}

export function scheme({ seed, variant = 'tonalSpot', contrast = 0, dark = false } = {}) {
  const s = normalizeSeed(seed);
  checkVariant(variant);
  checkContrast(contrast);
  if (isPublished(s, variant)) {
    const p = precomputed();
    return decodeScheme(p.schemes[s][variant][dark ? 'dark' : 'light'][p.contrasts.indexOf(contrast)]);
  }
  return mcuScheme({ seed: s, variant, contrast, dark }).roles;
}

// ---------------------------------------------------------------------------------------------
// Custom colors: harmonized with the seed (MCU Blend.harmonize). Their four roles take the primary
// roles of an MCU 2025 tonal-spot scheme whose primary palette is the harmonized color's own palette
// (its hue and chroma are kept), at the same mode and contrast.

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

function customScheme(name, hex, seed, contrast, dark) {
  const h = harmonize(hex, seed);
  const s = dynamicScheme(h, 'tonalSpot', contrast, dark, { primaryPalette: TonalPalette.fromInt(argbFromHex(h)) });
  const [n, on, c, onC] = customRoles(name);
  return {
    [n]: hexFromArgb(colors.primary().getArgb(s)),
    [on]: hexFromArgb(colors.onPrimary().getArgb(s)),
    [c]: hexFromArgb(colors.primaryContainer().getArgb(s)),
    [onC]: hexFromArgb(colors.onPrimaryContainer().getArgb(s)),
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

function headerLines(seed, variant, custom) {
  const out = [`material3 skill generated: color ${seed} ${variant}`];
  if (custom.length) out.push(`custom: ${custom.map(([n, h]) => `${n}=${h}`).join(', ')}`);
  out.push(`source: ${sourceOf(seed, variant)}`);
  out.push(NOTE);
  return out;
}

function modeValues(seed, variant, custom) {
  return MODES.map(m => {
    const roles = scheme({ seed, variant, contrast: m.contrast, dark: m.dark });
    const extra = Object.assign({}, ...custom.map(([n, h]) => customScheme(n, h, seed, m.contrast, m.dark)));
    return { ...m, roles, extra };
  });
}

function renderWeb({ seed, variant, custom, modes }) {
  const lines = headerLines(seed, variant, custom).map(l => `/* ${l} */`);
  const decls = (m, indent) => [...Object.entries(m.roles), ...Object.entries(m.extra)]
    .map(([r, v]) => `${indent}--md-sys-color-${kebab(r)}: ${v};`);
  const block = (sel, m) => [`${sel} {`, ...decls(m, '  '), '}'];
  const media = (sel, m) => ['@media (prefers-color-scheme: dark) {', `  ${sel} {`, ...decls(m, '    '), '  }', '}'];
  const by = name => modes.find(m => m.name === name);
  const parts = [
    block(':root', by('light')),
    media(':root:not([data-theme="light"])', by('dark')),
    block(':root[data-theme="dark"]', by('dark')),
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

function renderFlutter({ seed, variant, custom, modes, flutterLibrary }) {
  const out = headerLines(seed, variant, custom).map(l => `// ${l}`);
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

function renderCompose({ seed, variant, custom, modes, themePackage }) {
  const out = headerLines(seed, variant, custom).map(l => `// ${l}`);
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

export function renderTheme({ platform, seed, variant = 'tonalSpot', custom = {}, packageName, themePackage, flutterLibrary = 'material' } = {}) {
  if (!PLATFORMS.includes(platform)) throw new UsageError(`platform must be one of ${PLATFORMS.join(', ')}`);
  const s = normalizeSeed(seed);
  checkVariant(variant);
  const c = checkCustom(custom);
  if (!FLUTTER_IMPORTS[flutterLibrary]) throw new UsageError('flutter library must be material or material_ui');
  if (packageName != null && !/^[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*$/.test(packageName)) throw new UsageError(`bad package: ${packageName}`);
  const pkg = themePackage || (packageName ? `${packageName}.theme` : DEFAULT_THEME_PACKAGE);
  const modes = modeValues(s, variant, c);
  const args = { seed: s, variant, custom: c, modes, flutterLibrary, themePackage: pkg };
  return platform === 'web' ? renderWeb(args) : platform === 'flutter' ? renderFlutter(args) : renderCompose(args);
}

export function writeTheme({ platform, seed, variant = 'tonalSpot', out, custom, packageName, flutterLibrary } = {}) {
  if (!out) throw new UsageError('out is required');
  const text = renderTheme({ platform, seed, variant, custom, packageName, flutterLibrary });
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, text);
  const seedUsed = normalizeSeed(seed);
  return { seedRequested: seed, seedUsed, exact: true, source: sourceOf(seedUsed, variant), out };
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
  const custom = {};
  const cm = /^(?:\/\*|\/\/) custom: (.*?)(?: \*\/)?$/.exec(lines[1]);
  if (cm) {
    for (const pair of cm[1].split(', ')) {
      const [n, h] = pair.split('=');
      if (!n || !h || n in custom) return null;
      custom[n] = h;
    }
  }
  const opts = { platform, seed: m[1], variant: m[2], custom };
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

const USAGE = 'usage: index.mjs --seed #hex [--variant v] --platform web|flutter|compose --out file [--custom name=#hex]... '
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
    if (!(e instanceof UsageError)) throw e;
    console.error(`${e.message}\n${USAGE}`);
    return 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));

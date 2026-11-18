#!/usr/bin/env node
// Writes plugin/skills/material3/tokens/precomputed-schemes.json: the schemes the skill uses when Node
// is not available (spec section 8), and the published baseline scheme that scripts/color returns for
// the baseline seed.
//   node tools/build/precompute-schemes.mjs           write the file
//   node tools/build/precompute-schemes.mjs --check   fail if the committed file differs from a fresh build
//
// Seeds: the baseline seed #6750A4, then 24 hues (0, 15, ..., 345) x chroma 24, 48, 72. A grid seed
// is MCU's key color for that hue and chroma (TonalPalette.fromHueAndChroma(hue, chroma).keyColor).
// Variants: every MCU variant. Modes: light and dark at contrast 0, 0.5 and 1.
// Values: the baseline seed with tonalSpot is the published scheme (knowledge/tokens/merged.json:
// material-web md.sys.color.* resolved through md.ref.palette, all six modes; ruling R13). Everything
// else is scripts/color MCU output.
// Layout: schemes[seed][variant].light|dark = 3 strings (contrast 0, 0.5, 1); each string is the
// roles' hex values without '#', 6 characters per role, in `roles` order. `schemes` is the 2025 spec
// (M3 Expressive). `classic[seed][variant]` holds the 2021 spec (classic M3) for the variants whose
// 2021 and 2025 specs differ (`classicVariants`); for the other variants both styles use `schemes`.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACHROMATIC_CHROMA, ACHROMATIC_NOTE, BASELINE_SEED, CONTRASTS, GRID_CHROMAS, MCU_VERSION, ROLES, SPEC_VERSION, VARIANTS, effectiveSpec, mcuScheme,
} from '../../plugin/skills/material3/scripts/color/index.mjs';
import { Hct, TonalPalette, argbFromHex, hexFromArgb } from '../../plugin/skills/material3/scripts/color/mcu.mjs';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
export const OUT = join(REPO, 'plugin/skills/material3/tokens/precomputed-schemes.json');
export const HUES = Array.from({ length: 24 }, (_, i) => i * 15);
export const CHROMAS = GRID_CHROMAS;

const kebab = s => s.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
const round = n => Math.round(n * 100) / 100;

// Published baseline: { 'light' | 'light-medium-contrast' | ... : { role: '#rrggbb' } }.
export function publishedBaseline(merged = JSON.parse(readFileSync(join(REPO, 'knowledge/tokens/merged.json'), 'utf8'))) {
  const out = {};
  for (const dark of [false, true]) {
    for (const suffix of ['', '-medium-contrast', '-high-contrast']) {
      const mode = `${dark ? 'dark' : 'light'}${suffix}`;
      const byId = new Map();
      for (const e of merged) if (e.mode === mode || (e.id.startsWith('md.ref.palette.') && !e.mode)) byId.set(e.id, e);
      const resolve = (id, seen = new Set()) => {
        if (seen.has(id)) throw new Error(`reference loop at ${id}`);
        seen.add(id);
        const w = byId.get(id)?.perPlatform?.web;
        if (!w || w === 'NOT FOUND') throw new Error(`published baseline: no web value for ${id} (${mode})`);
        if (w.hex) return w.hex.slice(0, 7).toLowerCase();
        if (w.ref) return resolve(w.ref, seen);
        throw new Error(`published baseline: unusable value for ${id} (${mode})`);
      };
      out[mode] = Object.fromEntries(ROLES.map(r => [r, resolve(`md.sys.color.${kebab(r)}`)]));
    }
  }
  return out;
}

export function gridSeedList() {
  const b = Hct.fromInt(argbFromHex(BASELINE_SEED));
  const seeds = [{ seed: BASELINE_SEED, hue: round(b.hue), chroma: round(b.chroma), ...hsl(BASELINE_SEED), source: 'baseline' }];
  for (const hue of HUES) {
    for (const chroma of CHROMAS) {
      const k = TonalPalette.fromHueAndChroma(hue, chroma).keyColor;
      const seed = hexFromArgb(k.toInt()).toUpperCase();
      seeds.push({ seed, hue, chroma, seedHue: round(k.hue), seedChroma: round(k.chroma), ...hsl(seed), source: 'grid' });
    }
  }
  return seeds;
}

// HSL hue (0-360) and saturation (0-100) of a #rrggbb color, rounded to 0.1.
export function hsl(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const c = max - min;
  const l = (max + min) / 2;
  let h = 0;
  if (c) {
    if (max === r) h = ((g - b) / c) % 6;
    else if (max === g) h = (b - r) / c + 2;
    else h = (r - g) / c + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = c === 0 ? 0 : c / (1 - Math.abs(2 * l - 1));
  return { hslHue: Math.round(h * 10) / 10, hslSat: Math.round(s * 1000) / 10 };
}

// The smallest RGB range (max channel - min channel, 0-255) of any sRGB color whose HCT chroma is at
// least ACHROMATIC_CHROMA: below it a color is surely achromatic. Colors are visited by range, so only
// the few thousand near-gray colors are converted.
export function minChromaticRgbRange() {
  for (let range = 0; range < 256; range++) {
    for (let lo = 0; lo + range < 256; lo++) {
      const hi = lo + range;
      for (let r = lo; r <= hi; r++) for (let g = lo; g <= hi; g++) for (let b = lo; b <= hi; b++) {
        if (Math.min(r, g, b) !== lo || Math.max(r, g, b) !== hi) continue;
        if (Hct.fromInt(((0xff << 24) | (r << 16) | (g << 8) | b) >>> 0).chroma >= ACHROMATIC_CHROMA) return range;
      }
    }
  }
  return 256;
}

export function nearestRule(rgbRange = minChromaticRgbRange()) {
  return {
    rgbRange,
    achromatic: `A seed whose HCT chroma is below ${ACHROMATIC_CHROMA} (half the lowest grid chroma) is achromatic: use the baseline seed ${BASELINE_SEED} and say "${ACHROMATIC_NOTE}". `
      + `Without Node, HCT chroma is not available: treat the seed as achromatic when max(R,G,B) - min(R,G,B) < ${rgbRange} (channels 0-255). `
      + `${rgbRange} is the smallest such range of any sRGB color with HCT chroma ${ACHROMATIC_CHROMA} or more, so this test never sends a colorful seed to the baseline; `
      + 'a near-gray seed with a larger range is matched by hue instead.',
    withoutNode: 'Otherwise compute the HSL hue (0-360) and saturation (0-100). Pick the seed with the smallest circular hue distance to hslHue '
      + '(d = |a - b|, use 360 - d when d > 180), then the smallest |saturation - hslSat|, then the earliest in the seeds list. '
      + 'Say which seed was requested, which was used, and that installing Node gives an exact scheme.',
    withNode: 'scripts/color index.mjs --nearest #hex applies the same order with HCT hue and chroma (the hue and chroma fields); '
      + 'with Node, writeTheme computes the exact scheme for the requested seed instead.',
  };
}

const pack = roles => ROLES.map(r => roles[r].slice(1)).join('');

export const CLASSIC_VARIANTS = VARIANTS.filter(v => effectiveSpec(v, '2025') !== effectiveSpec(v, '2021'));

export function buildPrecomputed(merged) {
  const baseline = publishedBaseline(merged);
  const seeds = gridSeedList();
  const entryFor = (seed, variant, spec) => {
    const entry = { light: [], dark: [] };
    for (const dark of [false, true]) {
      for (const [i, contrast] of CONTRASTS.entries()) {
        const roles = seed === BASELINE_SEED && variant === 'tonalSpot'
          ? baseline[`${dark ? 'dark' : 'light'}${['', '-medium-contrast', '-high-contrast'][i]}`]
          : mcuScheme({ seed, variant, contrast, dark, spec }).roles;
        entry[dark ? 'dark' : 'light'].push(pack(roles));
      }
    }
    return entry;
  };
  const schemes = {};
  const classic = {};
  for (const { seed } of seeds) {
    schemes[seed] = Object.fromEntries(VARIANTS.map(v => [v, entryFor(seed, v, SPEC_VERSION)]));
    classic[seed] = Object.fromEntries(CLASSIC_VARIANTS.map(v => [v, entryFor(seed, v, '2021')]));
  }
  return {
    about: 'Precomputed Material 3 color schemes for the material3 skill. Generated; rebuild with the precompute tool.',
    mcu: MCU_VERSION,
    spec: SPEC_VERSION,
    published: { seed: BASELINE_SEED, variant: 'tonalSpot', source: 'md.sys.color (material-web, resolved through md.ref.palette)' },
    grid: 'baseline seed, then hue 0..345 step 15 x chroma 24, 48, 72; a grid seed is MCU TonalPalette.fromHueAndChroma(hue, chroma).keyColor',
    nearest: nearestRule(),
    layout: 'schemes[seed][variant].light|dark = [contrast 0, 0.5, 1]; each string holds the roles in order, 6 hex digits each',
    styles: 'M3 Expressive: schemes (2025 spec). Classic M3: classic[seed][variant] (2021 spec) for the classicVariants, schemes for every other variant (MCU defines those only in the 2021 spec).',
    roles: ROLES,
    variants: VARIANTS,
    contrasts: CONTRASTS,
    classicVariants: CLASSIC_VARIANTS,
    seeds,
    schemes,
    classic,
  };
}

// One seed per line keeps the file diffable.
export function serialize(p) {
  const head = { ...p };
  delete head.seeds;
  delete head.schemes;
  delete head.classic;
  const lines = ['{'];
  for (const [k, v] of Object.entries(head)) lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  lines.push('  "seeds": [');
  p.seeds.forEach((s, i) => lines.push(`    ${JSON.stringify(s)}${i < p.seeds.length - 1 ? ',' : ''}`));
  lines.push('  ],');
  for (const [name, last] of [['schemes', false], ['classic', true]]) {
    lines.push(`  ${JSON.stringify(name)}: {`);
    const keys = Object.keys(p[name]);
    keys.forEach((seed, i) => {
      lines.push(`    ${JSON.stringify(seed)}: {`);
      const vs = Object.keys(p[name][seed]);
      vs.forEach((v, j) => lines.push(`      ${JSON.stringify(v)}: ${JSON.stringify(p[name][seed][v])}${j < vs.length - 1 ? ',' : ''}`));
      lines.push(`    }${i < keys.length - 1 ? ',' : ''}`);
    });
    lines.push(last ? '  }' : '  },');
  }
  lines.push('}');
  return `${lines.join('\n')}\n`;
}

function main() {
  const text = serialize(buildPrecomputed());
  if (process.argv.includes('--check')) {
    const cur = existsSync(OUT) ? readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : null;
    if (cur !== text) { console.error('precomputed-schemes.json is stale; run node tools/build/precompute-schemes.mjs'); process.exit(1); }
    console.log('precomputed-schemes.json is up to date');
    return;
  }
  writeFileSync(OUT, text);
  console.log(`wrote ${OUT} (${Buffer.byteLength(text)} bytes)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();

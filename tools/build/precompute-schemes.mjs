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
// roles' hex values without '#', 6 characters per role, in `roles` order.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASELINE_SEED, CONTRASTS, MCU_VERSION, ROLES, SPEC_VERSION, VARIANTS, mcuScheme } from '../../plugin/skills/material3/scripts/color/index.mjs';
import { Hct, TonalPalette, argbFromHex, hexFromArgb } from '../../plugin/skills/material3/scripts/color/mcu.mjs';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
export const OUT = join(REPO, 'plugin/skills/material3/tokens/precomputed-schemes.json');
export const HUES = Array.from({ length: 24 }, (_, i) => i * 15);
export const CHROMAS = [24, 48, 72];

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
  const seeds = [{ seed: BASELINE_SEED, hue: round(b.hue), chroma: round(b.chroma), source: 'baseline' }];
  for (const hue of HUES) {
    for (const chroma of CHROMAS) {
      const k = TonalPalette.fromHueAndChroma(hue, chroma).keyColor;
      seeds.push({ seed: hexFromArgb(k.toInt()).toUpperCase(), hue, chroma, seedHue: round(k.hue), seedChroma: round(k.chroma), source: 'grid' });
    }
  }
  return seeds;
}

const pack = roles => ROLES.map(r => roles[r].slice(1)).join('');

export function buildPrecomputed(merged) {
  const baseline = publishedBaseline(merged);
  const seeds = gridSeedList();
  const schemes = {};
  for (const { seed } of seeds) {
    schemes[seed] = {};
    for (const variant of VARIANTS) {
      const entry = { light: [], dark: [] };
      for (const dark of [false, true]) {
        for (const [i, contrast] of CONTRASTS.entries()) {
          const roles = seed === BASELINE_SEED && variant === 'tonalSpot'
            ? baseline[`${dark ? 'dark' : 'light'}${['', '-medium-contrast', '-high-contrast'][i]}`]
            : mcuScheme({ seed, variant, contrast, dark }).roles;
          entry[dark ? 'dark' : 'light'].push(pack(roles));
        }
      }
      schemes[seed][variant] = entry;
    }
  }
  return {
    about: 'Precomputed Material 3 color schemes for the material3 skill. Generated; rebuild with the precompute tool.',
    mcu: MCU_VERSION,
    spec: SPEC_VERSION,
    published: { seed: BASELINE_SEED, variant: 'tonalSpot', source: 'md.sys.color (material-web, resolved through md.ref.palette)' },
    grid: 'baseline seed, then hue 0..345 step 15 x chroma 24, 48, 72; a grid seed is MCU TonalPalette.fromHueAndChroma(hue, chroma).keyColor',
    layout: 'schemes[seed][variant].light|dark = [contrast 0, 0.5, 1]; each string holds the roles in order, 6 hex digits each',
    roles: ROLES,
    variants: VARIANTS,
    contrasts: CONTRASTS,
    seeds,
    schemes,
  };
}

// One seed per line keeps the file diffable.
export function serialize(p) {
  const head = { ...p };
  delete head.seeds;
  delete head.schemes;
  const lines = ['{'];
  for (const [k, v] of Object.entries(head)) lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  lines.push('  "seeds": [');
  p.seeds.forEach((s, i) => lines.push(`    ${JSON.stringify(s)}${i < p.seeds.length - 1 ? ',' : ''}`));
  lines.push('  ],', '  "schemes": {');
  const keys = Object.keys(p.schemes);
  keys.forEach((seed, i) => {
    lines.push(`    ${JSON.stringify(seed)}: {`);
    const vs = Object.keys(p.schemes[seed]);
    vs.forEach((v, j) => lines.push(`      ${JSON.stringify(v)}: ${JSON.stringify(p.schemes[seed][v])}${j < vs.length - 1 ? ',' : ''}`));
    lines.push(`    }${i < keys.length - 1 ? ',' : ''}`);
  });
  lines.push('  }', '}');
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

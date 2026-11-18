#!/usr/bin/env node
// Maintainer tool, run in the m3-forge repository only (never by the skill at runtime).
// Builds plugin/skills/material3/assets/icons/symbols-outlined-24.tsv.gz (gzip of the TSV text) from the official Material
// Symbols Android vector drawables: one line per icon, <name> TAB <FILL 0 paths joined by |> TAB
// <FILL 1 paths joined by |, or = when identical>, plus an optional fourth field of flags: m = the official
// files carry android:autoMirrored="true", v = their viewport is 24 instead of 960. Path data is copied as written in the official files.
// Every file must be exactly the official form the Compose back end writes (scripts/icons/compose.mjs
// renderVector), so the skill can rebuild the byte-identical XML from the TSV line alone.
//
// Source: google/material-design-icons at the commit pinned in versions.json (symbols.commit), a
// sparse checkout of Outlined, 24 px, weight 400, grade 0 only, into an EMPTY temp directory
// (some icon paths exceed 260 characters on Windows: use a short path or set core.longpaths):
//   git clone --filter=blob:none --no-checkout --depth 1 https://github.com/google/material-design-icons.git <dir>
//   cd <dir>; git config core.longpaths true; git fetch --depth 1 --filter=blob:none origin <commit>
//   git sparse-checkout init --no-cone   (then write the SPARSE lines below to .git/info/sparse-checkout)
//   git checkout <commit>
// Usage: node tools/build/symbols-tsv.mjs <checkout dir> [--check]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flagsOf, gzipTsv, parseVector, TSV_FILE } from '../../plugin/skills/material3/scripts/icons/compose.mjs';

export const SPARSE = [
  '/symbols/android/*/materialsymbolsoutlined/*_24px.xml',
  '!/symbols/android/*/materialsymbolsoutlined/*_wght*',
  '!/symbols/android/*/materialsymbolsoutlined/*_grad*',
];

export function buildTsv(dir) {
  const base = join(dir, 'symbols', 'android');
  const lines = [];
  for (const name of readdirSync(base).sort()) {
    const read = (file) => {
      const parsed = parseVector(readFileSync(join(base, name, 'materialsymbolsoutlined', file), 'utf8'));
      if (!parsed) throw new Error(`${name}/${file}: not in the official vector form`);
      return parsed;
    };
    const a = read(`${name}_24px.xml`);
    const b = read(`${name}_fill1_24px.xml`);
    if (flagsOf(a) !== flagsOf(b)) throw new Error(`${name}: autoMirrored or viewport differs between FILL 0 and FILL 1`);
    const f0 = a.paths.join('|');
    const f1 = b.paths.join('|');
    lines.push(`${name}\t${f0}\t${f1 === f0 ? '=' : f1}${flagsOf(a) ? `\t${flagsOf(a)}` : ''}`);
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: node tools/build/symbols-tsv.mjs <checkout dir> [--check]'); process.exit(2); }
  const text = buildTsv(resolve(dir));
  if (process.argv.includes('--check')) {
    const same = readFileSync(TSV_FILE).equals(gzipTsv(text));
    console.log(same ? 'symbols-outlined-24.tsv is up to date' : 'symbols-outlined-24.tsv differs from a fresh build');
    process.exit(same ? 0 : 1);
  }
  const gz = gzipTsv(text);
  writeFileSync(TSV_FILE, gz);
  console.log(`wrote ${TSV_FILE}: ${text.split('\n').length - 1} icons, ${text.length} bytes plain, ${gz.length} gzipped`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();

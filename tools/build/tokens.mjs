#!/usr/bin/env node
// Skill token files from the knowledge base.
//   node tools/build/tokens.mjs           write plugin/skills/material3/tokens/{sys,comp}.json
//   node tools/build/tokens.mjs --check   fail if a committed file differs from a fresh build (CI)
//   --merged <file> --out <dir>           other input / output locations (tests)
//
// Every value comes verbatim from knowledge/tokens/merged.json through the resolution ladder
// (tools/build/ladder.mjs). Deprecated tokens are left out (Precedence rule 6). md.sys.* and md.ref.*
// go to sys.json, md.comp.* to comp.json.
//
// File shape (one token per line):
//   { "format": 1, "about": ..., "provenance": ..., "tokens": {
//     "<id>" or "<id>@<mode>": { "web": cell, "flutter": cell, "compose": cell } } }
//   cell = [<merged.json value>, "own" | "cross-source:<repo>" | "derived:<sys-token>"]
//        | [null, "library-default"]   (Flutter/Compose keep the library default; the web omits it)
//   (a two-item array rather than {value, provenance} keeps both files under 1.5 MB)
// A token that has several contexts in the sources (color schemes light/dark/contrast, motion
// standard/expressive) has one key per context: "md.sys.color.primary@dark".
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLATFORMS, keyOf, resolveEntry, idSet } from './ladder.mjs';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
export const MERGED = join(REPO, 'knowledge/tokens/merged.json');
export const OUT = join(REPO, 'plugin/skills/material3/tokens');
export const MAX_BYTES = 1.5 * 1024 * 1024;

const cache = new Map();
export function loadMerged(path = MERGED) {
  if (!cache.has(path)) cache.set(path, JSON.parse(readFileSync(path, 'utf8')));
  return cache.get(path);
}

const partOf = id => (id.split('.')[1] === 'comp' ? 'comp' : 'sys');

const cellOf = r => [r.value, r.provenance];

// { sys, comp }: key ("<id>" or "<id>@<mode>") -> { web, flutter, compose } cells ([value, provenance]),
// in merged.json order; exactly the "tokens" object of each file.
export function buildSkillTokens(merged = loadMerged()) {
  const ids = idSet(merged);
  const out = { sys: {}, comp: {} };
  for (const e of merged) {
    if (e.deprecated) continue;
    const cells = {};
    for (const p of Object.keys(PLATFORMS)) cells[p] = cellOf(resolveEntry(e, p, { ids }));
    out[partOf(e.id)][keyOf(e)] = cells;
  }
  return out;
}

const resolved = new Map();
// resolveToken('md.sys.color.primary', 'web', 'dark') or resolveToken('md.sys.color.primary@dark', 'web').
// null when the token is unknown, deprecated, or has several contexts and none was named.
export function resolveToken(id, platform, mode = null, merged = loadMerged()) {
  if (!PLATFORMS[platform]) throw new Error(`unknown platform: ${platform}`);
  if (!resolved.has(merged)) resolved.set(merged, { built: buildSkillTokens(merged) });
  const { built } = resolved.get(merged);
  const key = mode ? `${id}@${mode}` : id;
  const cell = built[partOf(key)][key];
  if (!cell) return null;
  const [value, provenance] = cell[platform];
  return { value, provenance };
}

const ABOUT = {
  sys: 'Material 3 system and reference tokens (md.sys.*, md.ref.*) per platform. Generated; do not edit.',
  comp: 'Material 3 component tokens (md.comp.*) per platform. Generated; do not edit.',
};
const PROVENANCE = 'Each platform cell is [value, provenance]. own: the platform\'s own library; cross-source:<repo>: the same token from another official repository; ' +
  'derived:<sys-token>: no repository gives a value, one maps the token to this sys token (use the platform\'s own value of it); ' +
  'library-default: no value (Flutter/Compose keep the library default, web omits the property). ' +
  'Keys with @<mode> are one context of a multi-context token (color scheme or motion scheme).';

export function renderFiles(built) {
  const files = new Map();
  for (const part of ['sys', 'comp']) {
    const lines = Object.entries(built[part]).map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`);
    files.set(`${part}.json`, `{"format":1,"about":${JSON.stringify(ABOUT[part])},"provenance":${JSON.stringify(PROVENANCE)},"tokens":{\n${lines.join(',\n')}\n}}\n`);
  }
  return files;
}

export function staleFiles(files, dir) {
  const stale = [];
  for (const [name, text] of files) {
    const p = join(dir, name);
    const cur = existsSync(p) ? readFileSync(p, 'utf8').replace(/\r\n/g, '\n') : null;
    if (cur !== text) stale.push(name);
  }
  return stale;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const mergedPath = opt('--merged') ?? MERGED;
  const outDir = opt('--out') ?? OUT;
  try {
    const files = renderFiles(buildSkillTokens(loadMerged(mergedPath)));
    const bytes = [...files.values()].reduce((a, t) => a + Buffer.byteLength(t), 0);
    if (bytes > MAX_BYTES) throw new Error(`skill token files are ${bytes} bytes (limit ${MAX_BYTES})`);
    if (args.includes('--check')) {
      const stale = staleFiles(files, outDir);
      if (stale.length) {
        console.error(`skill token files are stale: ${stale.join(', ')}; run \`node tools/build/tokens.mjs\``);
        process.exitCode = 1;
      } else console.log(`skill token files: up to date (${bytes} bytes)`);
    } else {
      mkdirSync(outDir, { recursive: true });
      for (const [name, text] of files) writeFileSync(join(outDir, name), text);
      console.log(`skill token files written: ${[...files.keys()].join(', ')} (${bytes} bytes)`);
    }
  } catch (e) {
    console.error(e.stack || e.message);
    process.exitCode = 1;
  }
}

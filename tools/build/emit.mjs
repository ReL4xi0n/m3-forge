#!/usr/bin/env node
// Token emitters: the theme asset files the material3 skill copies into projects.
//   node tools/build/emit.mjs                 write the files under plugin/skills/material3/
//   node tools/build/emit.mjs --check         fail if a committed file differs from a fresh build (CI)
//   --out <dir>                               another skill folder (tests)
//   --skipped                                 also list the tokens each platform leaves out, and why
//
// Input: buildSkillTokens() (tools/build/tokens.mjs). Output: assets/web/tokens.css,
// assets/flutter/lib/m3/*.dart, assets/compose/theme/*.kt (see emit/web.mjs, emit/flutter.mjs,
// emit/compose.mjs). Only the files listed here are checked; other files in those folders belong to
// other build steps.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSkillTokens } from './tokens.mjs';
import { emitWeb } from './emit/web.mjs';
import { emitFlutter } from './emit/flutter.mjs';
import { emitCompose } from './emit/compose.mjs';

export const SKILL = fileURLToPath(new URL('../../plugin/skills/material3/', import.meta.url));

// { files: Map(skill-relative path -> text), skipped: [{ key, platform, reason }] }
export function emitAll(built = buildSkillTokens()) {
  const files = new Map();
  const skipped = [];
  for (const emit of [emitWeb, emitFlutter, emitCompose]) {
    const r = emit(built.sys);
    for (const [p, t] of r.files) files.set(p, t);
    skipped.push(...r.skipped);
  }
  return { files, skipped };
}

export function staleFiles(files, dir) {
  const stale = [];
  for (const [p, text] of files) {
    const f = join(dir, ...p.split('/'));
    const cur = existsSync(f) ? readFileSync(f, 'utf8').replace(/\r\n/g, '\n') : null;
    if (cur !== text) stale.push(cur === null ? `${p} (missing)` : p);
  }
  return stale;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--out');
  const dir = i >= 0 ? args[i + 1] : SKILL;
  try {
    if (!dir) throw new Error('--out needs a folder');
    const { files, skipped } = emitAll();
    if (args.includes('--skipped')) {
      for (const s of skipped) console.log(`skipped ${s.platform} ${s.key}: ${s.reason}`);
    }
    if (args.includes('--check')) {
      const stale = staleFiles(files, dir);
      if (stale.length) {
        console.error(`token asset files are stale: ${stale.join(', ')}; run \`node tools/build/emit.mjs\``);
        process.exitCode = 1;
      } else console.log(`token asset files: up to date (${files.size} files)`);
    } else {
      for (const [p, text] of files) {
        const f = join(dir, ...p.split('/'));
        mkdirSync(dirname(f), { recursive: true });
        writeFileSync(f, text);
      }
      console.log(`token asset files written: ${files.size} (${skipped.length} token cells left out; --skipped lists them)`);
    }
  } catch (e) {
    console.error(e.stack || e.message);
    process.exitCode = 1;
  }
}

#!/usr/bin/env node
// Runs the skill's verify script on every example folder: examples/<web|flutter|compose>/<name>/.
// Skips cleanly (exit 0) while there are no examples. Exit 1 if any example has an error, 2 on a
// folder that is not under a platform folder.
//   node tools/ci/verify-examples.mjs [examplesDir]
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify, PLATFORMS } from '../../plugin/skills/material3/scripts/verify/index.mjs';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const dirs = p => (existsSync(p) ? readdirSync(p).filter(n => !n.startsWith('.') && statSync(join(p, n)).isDirectory()) : []);

export function findExamples(root) {
  const found = [];
  const unknown = [];
  for (const platform of dirs(root)) {
    if (!PLATFORMS.includes(platform)) { unknown.push(platform); continue; }
    for (const name of dirs(join(root, platform))) found.push({ platform, name, dir: join(root, platform, name) });
  }
  return { found, unknown };
}

export async function verifyExamples(root) {
  const { found, unknown } = findExamples(root);
  const results = [];
  for (const ex of found) {
    const r = await verify({ projectDir: ex.dir, platform: ex.platform });
    results.push({ ...ex, exitCode: r.exitCode, errors: r.violations.filter(v => v.severity === 'error') });
  }
  return { results, unknown };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] || join(REPO, 'examples'));
  const { results, unknown } = await verifyExamples(root);
  if (unknown.length) { console.error(`examples: not a platform folder: ${unknown.join(', ')}`); process.exit(2); }
  if (!results.length) { console.log('examples: none yet, skipped'); process.exit(0); }
  let bad = 0;
  for (const r of results) {
    console.log(`${r.platform}/${r.name}: ${r.errors.length} error(s)`);
    for (const e of r.errors) console.log(`  ${e.check} ${e.file ?? ''}:${e.line ?? ''} ${e.detail}`);
    if (r.exitCode) bad++;
  }
  process.exit(bad ? 1 : 0);
}

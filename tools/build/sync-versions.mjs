// Compares the pinned versions in plugin/skills/material3/versions.json with the Gradle version
// catalogs that must agree with them. --check only reads. Without --check, only the skill's own
// template catalog is rewritten; the fixture and harness catalogs are frozen measurement inputs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const VERSIONS = 'plugin/skills/material3/versions.json';

export const TARGETS = [
  'evals/fixtures/compose-1.5/gradle/libs.versions.toml',
  'harness/compose/test/sample_app/gradle/libs.versions.toml',
];
export const TEMPLATE_TARGETS = ['plugin/skills/material3/assets/compose/template/gradle/libs.versions.toml'];

function expected(v) {
  return { agp: v.compose.agp, kotlin: v.compose.kotlin, material3: v.compose.material3, compileSdk: String(v.compose.compileSdk) };
}

// Keys present in the catalog's [versions] table that versions.json pins and that differ.
function mismatches(text, want) {
  const out = [];
  for (const [key, value] of Object.entries(want)) {
    const m = new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, 'm').exec(text);
    if (m && m[1] !== value) out.push([key, value]);
  }
  return out;
}

export function syncReport({ check = true, root = REPO } = {}) {
  const v = JSON.parse(readFileSync(join(root, VERSIONS), 'utf8'));
  const want = expected(v);
  const differ = [];
  const absent = [];
  for (const rel of [...TARGETS, ...TEMPLATE_TARGETS]) {
    const abs = join(root, rel);
    if (!existsSync(abs)) { absent.push(rel); continue; }
    let text = readFileSync(abs, 'utf8');
    const bad = mismatches(text, want);
    if (!bad.length) continue;
    differ.push(rel);
    if (!check && TEMPLATE_TARGETS.includes(rel)) {
      for (const [key, value] of bad) text = text.replace(new RegExp(`^(${key}\\s*=\\s*")[^"]*(")`, 'm'), `$1${value}$2`);
      writeFileSync(abs, text);
    }
  }
  return { differ, absent };
}

export function syncVersions(opts = {}) {
  return syncReport(opts).differ;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes('--check');
  const { differ, absent } = syncReport({ check });
  for (const f of absent) console.log(`absent (skipped): ${f}`);
  for (const f of differ) console.log(`differs from versions.json: ${f}`);
  if (differ.length && check) process.exit(1);
  console.log(differ.length ? 'updated template catalogs; frozen files must be reviewed by hand' : 'versions in sync');
}

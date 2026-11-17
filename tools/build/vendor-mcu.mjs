#!/usr/bin/env node
// Vendors @material/material-color-utilities 0.4.0 (the pinned npm archive, knowledge/sources.lock.json)
// into plugin/skills/material3/scripts/color/vendor/mcu/ and records it in versions.json `tools`.
//   node tools/build/vendor-mcu.mjs           write the vendored files and the versions.json entry
//   node tools/build/vendor-mcu.mjs --check   fail if the committed tree differs from a fresh plan
//
// Only the modules the color script imports (and their imports) are copied, plus LICENSE and
// package.json (its "type": "module" makes Node load the files as ES modules wherever the skill lives).
// Ruling R14: the files are unchanged except that `.js` is appended to extensionless relative import
// specifiers; the npm build ships 10 of them (Node's ES module loader cannot resolve them).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const SKILL = join(REPO, 'plugin/skills/material3');
export const VENDOR_REL = 'scripts/color/vendor/mcu';
export const VENDOR_DIR = join(SKILL, ...VENDOR_REL.split('/'));
const toolchain = process.env.M3_TOOLCHAIN || join(homedir(), '.m3-toolchain');
export const ARCHIVE = join(toolchain, 'sources', 'material-color-utilities.archive');

// The modules scripts/color/mcu.mjs imports.
export const ENTRIES = [
  'blend/blend.js',
  'dynamiccolor/dynamic_scheme.js',
  'dynamiccolor/material_dynamic_colors.js',
  'dynamiccolor/variant.js',
  'hct/hct.js',
  'palettes/tonal_palette.js',
  'utils/string_utils.js',
  'utils/theme_utils.js',
];
const EXTRA = ['LICENSE', 'package.json'];

const sha = b => createHash('sha256').update(b).digest('hex');

// Minimal reader for the npm tarball (gzip + ustar). Returns Map(path below package/ -> Buffer).
export function readArchive(buf) {
  const tar = gunzipSync(buf);
  const files = new Map();
  let off = 0;
  let paxPath = null;
  while (off + 512 <= tar.length) {
    const h = tar.subarray(off, off + 512);
    if (h.every(b => b === 0)) break;
    const str = (a, b) => h.subarray(a, b).toString('utf8').replace(/\0.*$/s, '');
    let name = str(0, 100);
    const prefix = str(345, 500);
    if (prefix) name = `${prefix}/${name}`;
    const size = parseInt(str(124, 136).trim() || '0', 8);
    const type = String.fromCharCode(h[156] || 48);
    const body = tar.subarray(off + 512, off + 512 + size);
    if (type === 'x') {
      const m = /\d+ path=([^\n]*)\n/.exec(body.toString('utf8'));
      paxPath = m ? m[1] : null;
    } else if (type === '0') {
      const p = (paxPath || name).replace(/^package\//, '');
      files.set(p, Buffer.from(body));
      paxPath = null;
    } else {
      paxPath = null;
    }
    off += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}

const SPEC = /(\b(?:from|import)\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;

// Appends `.js` to relative import/export specifiers that have no extension.
export function addJsToSpecifiers(text) {
  const changed = [];
  const out = text.replace(SPEC, (all, kw, q, spec) => {
    if (/\.[cm]?js$/.test(spec) || /\.json$/.test(spec)) return all;
    changed.push(spec);
    return `${kw}${q}${spec}.js${q}`;
  });
  return { text: out, changed };
}

// Map(relative path -> Buffer) of the files to vendor: the import closure of ENTRIES, plus EXTRA.
export function vendorPlan(upstream) {
  const plan = new Map();
  const queue = [...ENTRIES];
  while (queue.length) {
    const rel = queue.shift();
    if (plan.has(rel)) continue;
    const src = upstream.get(rel);
    if (!src) throw new Error(`not in the archive: ${rel}`);
    const fixed = addJsToSpecifiers(src.toString('utf8'));
    plan.set(rel, fixed.changed.length ? Buffer.from(fixed.text, 'utf8') : src);
    for (const m of fixed.text.matchAll(SPEC)) queue.push(posix.normalize(posix.join(posix.dirname(rel), m[3])));
  }
  for (const rel of EXTRA) plan.set(rel, upstream.get(rel));
  return plan;
}

// SHA-256 over the sorted lines "<sha256 of file>  <path>\n" of the listed files.
export function treeHash(dir, files) {
  const lines = [...files].sort().map(rel => `${sha(readFileSync(join(dir, ...rel.split('/'))))}  ${rel}\n`);
  return sha(lines.join(''));
}

function lockEntry() {
  const lock = JSON.parse(readFileSync(join(REPO, 'knowledge/sources.lock.json'), 'utf8'));
  return lock.sources.find(s => s.id === 'material-color-utilities');
}

export function toolsEntry(files, patched) {
  const pinned = lockEntry();
  return {
    name: '@material/material-color-utilities',
    version: pinned.version,
    license: pinned.license,
    path: VENDOR_REL,
    archive: { url: pinned.url, sha256: pinned.sha256 },
    tree: {
      sha256: treeHash(VENDOR_DIR, files),
      method: 'sha256 over the sorted lines "<sha256 of file>  <path>\\n" for the files listed',
      files,
    },
    modified: `import specifiers only: .js appended to extensionless relative imports (${patched.join(', ')})`,
  };
}

function main() {
  const check = process.argv.includes('--check');
  const pinned = lockEntry();
  const buf = readFileSync(ARCHIVE);
  if (sha(buf) !== pinned.sha256) throw new Error(`archive sha256 differs from sources.lock.json: ${ARCHIVE}`);
  const upstream = readArchive(buf);
  const plan = vendorPlan(upstream);
  const files = [...plan.keys()].sort();
  const patched = files.filter(f => !plan.get(f).equals(upstream.get(f)));
  if (check) {
    const bad = files.filter(f => {
      const p = join(VENDOR_DIR, ...f.split('/'));
      return !existsSync(p) || !readFileSync(p).equals(plan.get(f));
    });
    const list = (dir, prefix = '') => readdirSync(dir, { withFileTypes: true })
      .flatMap(e => (e.isDirectory() ? list(join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`]));
    if (existsSync(VENDOR_DIR)) for (const f of list(VENDOR_DIR)) if (!plan.has(f)) bad.push(`${f} (unexpected)`);
    const versions = JSON.parse(readFileSync(join(SKILL, 'versions.json'), 'utf8'));
    const entry = versions.tools.find(t => t.name === '@material/material-color-utilities');
    if (bad.length === 0 && JSON.stringify(entry) !== JSON.stringify(toolsEntry(files, patched))) bad.push('versions.json tools entry');
    if (bad.length) { console.error(`vendored MCU differs: ${bad.join(', ')}`); process.exit(1); }
    console.log(`vendored MCU ok: ${files.length} files`);
    return;
  }
  rmSync(VENDOR_DIR, { recursive: true, force: true });
  for (const f of files) {
    const p = join(VENDOR_DIR, ...f.split('/'));
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, plan.get(f));
  }
  const vpath = join(SKILL, 'versions.json');
  const versions = JSON.parse(readFileSync(vpath, 'utf8'));
  const entry = toolsEntry(files, patched);
  versions.tools = [...versions.tools.filter(t => t.name !== entry.name), entry];
  writeFileSync(vpath, `${JSON.stringify(versions, null, 2)}\n`);
  console.log(`vendored ${files.length} files (${patched.length} with fixed specifiers: ${patched.join(', ')})`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();

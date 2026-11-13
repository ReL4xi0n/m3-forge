#!/usr/bin/env node
// Knowledge note linter.
//   lint.mjs                        lint knowledge/guidance/**/*.md, write knowledge/site-values.json
//   lint.mjs --check                lint, and fail if site-values.json is stale (CI)
//   lint.mjs --require-coverage     also require every scraped page to be cited by some note
//   lint.mjs --files <note...>      report errors only for these notes (site-values.json is not written)
//
// Every number with a unit (dp|px|sp|ms|%) and every hex color must carry a marker on the same line:
//   [token:<id>]  the id must exist in knowledge/tokens/merged.json and the value must equal one of its
//                 values (any platform; refs followed; % compared as a fraction)
//   [site:<path>] the path must be a scraped page; the value is recorded in site-values.json and a
//                 differing [token:] on the same line becomes a site-vs-repo conflict, not an error
//   [NOT FOUND]
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compare } from '../tokens/merge.mjs';

export const KINDS = ['style', 'foundation', 'component', 'expressive'];
export const SECTIONS = {
  component: ['Summary', 'Use it when', 'Anatomy', 'Variants', 'Expressive', 'States and behavior', 'Measurements',
    'Typography', 'Color roles and state layers', 'Motion', 'Accessibility', 'Platform mapping', 'Pitfalls'],
  style: ['Summary', 'Rules', 'Measurements', 'Accessibility', 'Platform mapping', 'Pitfalls'],
};
SECTIONS.foundation = SECTIONS.style;
SECTIONS.expressive = SECTIONS.style;

const NUMBER = /(?<![\w.#-])(\d+(?:\.\d+)?)\s?(dp|px|sp|ms|%)(?!\w)/g;
const HEX = /(?<![\w&])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w])/g;

function literal(num, unit) {
  const n = Number(num);
  if (unit === 'px' || unit === 'dp') return { dp: n };
  if (unit === '%') return { number: n / 100 };
  return { [unit]: n };
}
function hexValue(h) {
  let x = h.toLowerCase();
  if (x.length === 3) x = x.split('').map(c => c + c).join('');
  if (x.length === 6) x += 'ff';
  return { hex: `#${x}` };
}
const show = v => (v.hex ? v.hex : `${v.dp ?? v.sp ?? v.ms ?? v.number}${v.dp !== undefined ? 'dp' : v.sp !== undefined ? 'sp' : v.ms !== undefined ? 'ms' : ''}`);

function parseFrontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!m) return { fm: null, bodyStart: 0 };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^(\w+):\s*(.*?)\s*(?:#.*)?$/.exec(line);
    if (!kv) continue;
    let v = kv[2];
    if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    else if (v === 'true' || v === 'false') v = v === 'true';
    fm[kv[1]] = v;
  }
  return { fm, bodyStart: m[0].split(/\r?\n/).length - 1 };
}

export const anchorOf = heading => heading.toLowerCase().replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-');
const PLATFORM_KEYS = ['web', 'flutter', 'compose'];
const AGREEMENT = /\b(same|agree|agrees|identical|match|matches)\b/i;
const PLATFORM_WORD = /\b(material-web|flutter|compose|platforms?)\b/i;

async function listNotes(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  async function walk(d) {
    for (const e of await readdir(d, { withFileTypes: true })) {
      const abs = join(d, e.name);
      if (e.isDirectory()) await walk(abs);
      else if (e.name.endsWith('.md')) out.push(abs);
    }
  }
  await walk(dir);
  return out.sort();
}

export async function lintNotes(notesDir, { merged, coverage, exceptions = {}, requireCoverage = false, files = null }) {
  const errors = [];
  const siteValues = [];
  const notFound = [];
  const done = new Set(coverage.rows.filter(r => r.status === 'done').map(r => r.path));
  const byId = new Map();
  for (const m of merged) (byId.get(m.id) || byId.set(m.id, []).get(m.id)).push(m);
  const valuesOf = (id, depth = 0) => {
    const out = [];
    for (const m of byId.get(id) || []) {
      for (const v of [m.canonical, ...Object.values(m.perPlatform || {}), ...Object.values(m.crossCheck || {})]) {
        if (!v || v === 'NOT FOUND') continue;
        if (v.ref && depth < 10) out.push(...valuesOf(v.ref, depth + 1));
        else out.push(v);
      }
    }
    return out;
  };
  const cited = new Set();
  // Per-platform index (id -> { value }) so compare() follows refs inside each platform, exactly as the
  // token merge does.
  const platformIndex = Object.fromEntries(PLATFORM_KEYS.map(p => {
    const idx = new Map();
    for (const m of merged) {
      const v = m.perPlatform?.[p];
      if (v && v !== 'NOT FOUND' && !idx.has(m.id)) idx.set(m.id, { value: v });
    }
    return [p, idx];
  }));
  const rawValues = id => (byId.get(id) || []).map(entry => Object.fromEntries(PLATFORM_KEYS.map(p => {
    const v = entry.perPlatform?.[p];
    return [p, v && v !== 'NOT FOUND' ? v : null];
  })));
  const cmp = (pv, p, q) => compare(pv[p], pv[q], platformIndex[p], platformIndex[q]);
  const differs = id => rawValues(id).some(pv => {
    const ps = PLATFORM_KEYS.filter(p => pv[p]);
    return ps.some((p, i) => ps.slice(i + 1).some(q => cmp(pv, p, q) === 'different'));
  });
  const allSame = id => {
    const pvs = rawValues(id);
    return pvs.length > 0 && pvs.every(pv => PLATFORM_KEYS.every(p => pv[p])
      && PLATFORM_KEYS.every((p, i) => PLATFORM_KEYS.slice(i + 1).every(q => cmp(pv, p, q) === 'same')));
  };

  const notes = await listNotes(notesDir);
  const anchors = new Map();
  for (const abs of notes) {
    const set = new Set();
    for (const l of (await readFile(abs, 'utf8')).split(/\r?\n/)) {
      const h = /^##\s+(.+?)\s*$/.exec(l);
      if (h) set.add(anchorOf(h[1]));
    }
    anchors.set(abs.replace(/\\/g, '/').split('/').pop(), set);
  }

  for (const abs of notes) {
    const label = `knowledge/guidance/${relative(notesDir, abs).replace(/\\/g, '/')}`;
    const text = await readFile(abs, 'utf8');
    const lines = text.split(/\r?\n/);
    const err = (n, msg) => errors.push(`${label}:${n}: ${msg}`);
    const { fm, bodyStart } = parseFrontMatter(text);
    if (!fm) { err(1, 'missing front matter'); continue; }
    for (const k of ['title', 'kind', 'pages', 'tokenSets', 'expressive', 'fetched']) if (!(k in fm)) err(1, `front matter: missing ${k}`);
    if (!KINDS.includes(fm.kind)) err(1, `front matter: kind must be one of ${KINDS.join(', ')}`);
    for (const p of Array.isArray(fm.pages) ? fm.pages : []) {
      cited.add(p);
      if (!done.has(p)) err(1, `front matter: page ${p} is not a scraped page`);
    }

    const sections = new Map();
    let current = null;
    for (let i = bodyStart; i < lines.length; i++) {
      const h = /^##\s+(.+?)\s*$/.exec(lines[i]);
      if (h) { current = { name: h[1], line: i + 1, content: 0 }; sections.set(h[1], current); continue; }
      if (current && lines[i].trim()) current.content++;
    }
    for (const s of SECTIONS[fm.kind] || []) {
      if (!sections.has(s)) err(1, `missing section "## ${s}"`);
      else if (!sections.get(s).content) err(sections.get(s).line, `empty section "## ${s}"`);
    }

    const citedTokens = new Map();
    const acknowledged = new Set();
    for (let i = bodyStart; i < lines.length; i++) {
      for (const m of lines[i].matchAll(/\b([a-z0-9-]+\.md)#([a-z0-9-]+)/g)) {
        if (!anchors.get(m[1])?.has(m[2])) err(i + 1, `broken reference ${m[1]}#${m[2]}`);
      }
      for (const m of lines[i].matchAll(/\[token:([^\]\s]+)\]/g)) if (!citedTokens.has(m[1])) citedTokens.set(m[1], i + 1);
      for (const m of lines[i].matchAll(/\[differs:([^\]\s]+)\]/g)) {
        acknowledged.add(m[1]);
        if (byId.has(m[1]) && !differs(m[1])) err(i + 1, `[differs:${m[1]}] but the platforms agree`);
      }
      for (const m of lines[i].matchAll(/\[same:([^\]\s]+)\]/g)) if (!allSame(m[1])) err(i + 1, `[same:${m[1]}] is not true (a platform differs or lacks the token)`);
      if (AGREEMENT.test(lines[i]) && PLATFORM_WORD.test(lines[i]) && !/\[same:/.test(lines[i])) {
        err(i + 1, 'platform agreement claim without [same:] marker (verify it or remove it)');
      }
    }
    for (const [t, line] of citedTokens) {
      if (byId.has(t) && differs(t) && !acknowledged.has(t)) err(line, `token ${t} differs between platforms; acknowledge it with [differs:${t}]`);
    }

    // Every [NOT FOUND] statement is listed in the generated not-found.md.
    for (let i = bodyStart; i < lines.length; i++) {
      if (/\[NOT FOUND\]/.test(lines[i])) notFound.push({ note: label, line: i + 1, text: lines[i].trim() });
    }

    // Table rows are checked cell by cell: a value pairs with the markers in its own cell.
    const segmentsOf = line => (/^\s*\|.*\|\s*$/.test(line) ? line.split('|') : [line]);
    for (let i = bodyStart; i < lines.length; i++) for (const line of segmentsOf(lines[i])) {
      const values = [...line.matchAll(NUMBER)].map(m => literal(m[1], m[2])).concat([...line.matchAll(HEX)].map(m => hexValue(m[1])));
      const tokens = [...line.matchAll(/\[token:([^\]\s]+)\]/g)].map(m => m[1]);
      const sites = [...line.matchAll(/\[site:([^\]\s]+)\]/g)].map(m => m[1]);
      const nf = /\[NOT FOUND\]/.test(line);
      // [impl:<source-id>/<path>:<line>] = value read from official library code (an implementation
      // reference, not a token). Format-checked here; the sources live in the toolchain folder.
      const impls = [...line.matchAll(/\[impl:([^\]\s]+)\]/g)].map(m => m[1]);
      for (const x of impls) if (!/^[a-z0-9_-]+\/.+:\d+$/.test(x)) err(i + 1, `[impl:${x}] must be <source-id>/<path>:<line>`);
      for (const t of tokens) if (!byId.has(t)) err(i + 1, `unknown token ${t}`);
      for (const s of sites) if (!done.has(s)) err(i + 1, `[site:${s}] is not a scraped page`);
      if (!values.length) continue;
      if (!tokens.length && !sites.length && !nf && !impls.length) { err(i + 1, 'number without provenance marker'); continue; }
      if (sites.length) {
        for (const v of values) {
          siteValues.push({ page: sites[0], ...(tokens[0] ? { token: tokens[0] } : {}), value: v, note: label, line: i + 1 });
        }
        continue;
      }
      if (!tokens.length) continue;
      const candidates = tokens.flatMap(t => valuesOf(t));
      for (const v of values) {
        if (!candidates.some(c => compare(v, c) === 'same')) err(i + 1, `value ${show(v)} does not match token ${tokens.join(', ')}`);
      }
    }
  }

  if (requireCoverage) {
    for (const p of [...done].sort()) {
      if (!cited.has(p) && exceptions[p]?.kind !== 'owner-excluded') errors.push(`page not covered by any note: ${p}`);
    }
  }
  siteValues.sort((a, b) => a.note.localeCompare(b.note) || a.line - b.line);
  const shown = files ? errors.filter(e => files.some(f => e.startsWith(`${f}:`))) : errors;
  notFound.sort((a, b) => a.note.localeCompare(b.note) || a.line - b.line);
  return { errors: shown, siteValues, notFound };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const k = join(root, 'knowledge');
  const load = async f => JSON.parse(await readFile(join(k, f), 'utf8'));
  const { errors, siteValues, notFound } = await lintNotes(join(k, 'guidance'), {
    merged: await load('tokens/merged.json'),
    coverage: await load('coverage.json'),
    exceptions: await load('coverage-exceptions.json'),
    requireCoverage: process.argv.includes('--require-coverage'),
    // --files a.md b.md: report only errors in these notes (writers working in parallel)
    files: process.argv.includes('--files')
      ? process.argv.slice(process.argv.indexOf('--files') + 1).filter(a => !a.startsWith('--')).map(f => f.replace(/\\/g, '/'))
      : null,
  });
  for (const e of errors) console.error(e);
  const outputs = [
    [join(k, 'site-values.json'), JSON.stringify(siteValues, null, 2) + '\n'],
    [join(k, 'notes-not-found.json'), JSON.stringify(notFound, null, 2) + '\n'],
  ];
  for (const [file, out] of outputs) {
    if (process.argv.includes('--check')) {
      const cur = existsSync(file) ? await readFile(file, 'utf8') : null;
      if (cur !== out) { console.error(`${file} is stale; run \`npm run knowledge:lint\``); process.exitCode = 1; }
    } else if (!process.argv.includes('--files')) {
      await writeFile(file, out);
    }
  }
  if (errors.length) process.exitCode = 1;
  console.log(`knowledge lint: ${errors.length} error(s), ${siteValues.length} site value(s)`);
}

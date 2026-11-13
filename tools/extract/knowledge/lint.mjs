#!/usr/bin/env node
// Knowledge note linter.
//   lint.mjs                        lint knowledge/guidance/**/*.md, write knowledge/site-values.json
//   lint.mjs --check                lint, and fail if site-values.json is stale (CI)
//   lint.mjs --require-coverage     also require every scraped page to be cited by some note
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
  component: ['Summary', 'Use it when', 'Anatomy', 'Variants', 'Expressive', 'States and behavior', 'Measurements', 'Accessibility', 'Platform mapping', 'Pitfalls'],
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

export async function lintNotes(notesDir, { merged, coverage, exceptions = {}, requireCoverage = false }) {
  const errors = [];
  const siteValues = [];
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

  for (const abs of await listNotes(notesDir)) {
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

    // Table rows are checked cell by cell: a value pairs with the markers in its own cell.
    const segmentsOf = line => (/^\s*\|.*\|\s*$/.test(line) ? line.split('|') : [line]);
    for (let i = bodyStart; i < lines.length; i++) for (const line of segmentsOf(lines[i])) {
      const values = [...line.matchAll(NUMBER)].map(m => literal(m[1], m[2])).concat([...line.matchAll(HEX)].map(m => hexValue(m[1])));
      const tokens = [...line.matchAll(/\[token:([^\]\s]+)\]/g)].map(m => m[1]);
      const sites = [...line.matchAll(/\[site:([^\]\s]+)\]/g)].map(m => m[1]);
      const nf = /\[NOT FOUND\]/.test(line);
      for (const t of tokens) if (!byId.has(t)) err(i + 1, `unknown token ${t}`);
      for (const s of sites) if (!done.has(s)) err(i + 1, `[site:${s}] is not a scraped page`);
      if (!values.length) continue;
      if (!tokens.length && !sites.length && !nf) { err(i + 1, 'number without provenance marker'); continue; }
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
  return { errors, siteValues };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const k = join(root, 'knowledge');
  const load = async f => JSON.parse(await readFile(join(k, f), 'utf8'));
  const { errors, siteValues } = await lintNotes(join(k, 'guidance'), {
    merged: await load('tokens/merged.json'),
    coverage: await load('coverage.json'),
    exceptions: await load('coverage-exceptions.json'),
    requireCoverage: process.argv.includes('--require-coverage'),
  });
  for (const e of errors) console.error(e);
  const out = JSON.stringify(siteValues, null, 2) + '\n';
  const file = join(k, 'site-values.json');
  if (process.argv.includes('--check')) {
    const cur = existsSync(file) ? await readFile(file, 'utf8') : null;
    if (cur !== out) { console.error('knowledge/site-values.json is stale; run `npm run knowledge:lint`'); process.exitCode = 1; }
  } else {
    await writeFile(file, out);
  }
  if (errors.length) process.exitCode = 1;
  console.log(`knowledge lint: ${errors.length} error(s), ${siteValues.length} site value(s)`);
}

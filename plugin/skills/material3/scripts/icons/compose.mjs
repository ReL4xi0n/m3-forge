// Compose back end of the icons script: official Material Symbols Android vector drawables, written to
// res/drawable/m3s_<name>.xml (FILL 0) and m3s_<name>_fill1.xml (FILL 1). Nothing is drawn or edited:
// the path data comes from assets/icons/symbols-outlined-24.tsv.gz (gzipped TSV; Outlined, every icon) or from the
// official XML of Rounded or Sharp, downloaded at the pinned commit and accepted only when every path
// hashes into verify's symbols-paths.json. The text around the path data is the official file's own.
//
// TSV line: <name> TAB <FILL 0 paths joined by |> TAB <FILL 1 paths joined by |, or = when identical>
// and an optional fourth field of flags: `m` = the official files carry android:autoMirrored="true"
// (514 of 8,314 files), `v` = their viewport is 24 instead of 960 (134 files).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { StyleFontError, fallbackNotice, VERSIONS_FILE } from './download.mjs';
import { isOfficial, normalizePath, xmlVectorIcon } from '../verify/symbols.mjs';

export const TSV_FILE = fileURLToPath(new URL('../../assets/icons/symbols-outlined-24.tsv.gz', import.meta.url));

// Deterministic gzip of the TSV text (level 9, no name or time, OS byte 3 as `gzip -9 -n` writes on Unix).
export function gzipTsv(text) {
  const gz = gzipSync(Buffer.from(text, 'utf8'), { level: 9 });
  gz.fill(0, 4, 8);
  gz[9] = 3;
  return gz;
}

export const readTsv = (file = TSV_FILE) => gunzipSync(readFileSync(file)).toString('utf8');

const head = (vp) => [
  '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
  '    android:width="24dp"',
  '    android:height="24dp"',
  `    android:viewportWidth="${vp}"`,
  `    android:viewportHeight="${vp}"`,
];
const TINT = '    android:tint="?attr/colorControlNormal"';
const pathBlock = (d) => ['  <path', '      android:fillColor="@android:color/white"', `      android:pathData="${d}"/>`];

// The official file text for a list of path data strings (LF, trailing newline).
export function renderVector(paths, { mirror = false, small = false } = {}) {
  const open = mirror ? [TINT, '    android:autoMirrored="true">'] : [`${TINT}>`];
  return `${[...head(small ? 24 : 960), ...open, ...paths.flatMap(pathBlock), '</vector>'].join('\n')}\n`;
}

export const flagsOf = ({ mirror, small }) => (mirror ? 'm' : '') + (small ? 'v' : '');

// { paths, mirror } of an official vector XML, or null when the file is not in the official form
// (the text re-rendered from its own paths must equal it byte for byte).
export function parseVector(text) {
  const t = text.replace(/\r\n?/g, '\n');
  const paths = [...t.matchAll(/android:pathData="([^"]*)"/g)].map((m) => m[1]);
  const mirror = t.includes('android:autoMirrored="true"');
  const small = t.includes('android:viewportWidth="24"');
  return paths.length && renderVector(paths, { mirror, small }) === t ? { paths, mirror, small } : null;
}

export const fileNames = (name) => [`m3s_${name}.xml`, `m3s_${name}_fill1.xml`];

// loadTsv(names, file) -> Map name -> { fill0: string[], fill1: string[], mirror: boolean } for the names found.
export function loadTsv(names, file = TSV_FILE) {
  const want = new Set(names);
  const out = new Map();
  for (const line of readTsv(file).split('\n')) {
    const tab = line.indexOf('\t');
    if (tab < 0 || !want.has(line.slice(0, tab))) continue;
    const [name, f0, f1, flag] = line.split('\t');
    out.set(name, { fill0: f0.split('|'), fill1: (f1 === '=' ? f0 : f1).split('|'), mirror: flag?.includes('m') ?? false, small: flag?.includes('v') ?? false });
    if (out.size === want.size) break;
  }
  return out;
}

const posix = (p) => p.replaceAll('\\', '/');

function drawableDir(projectDir) {
  const mod = existsSync(join(projectDir, 'app')) ? 'app/' : '';
  return `${mod}src/main/res/drawable`;
}

// An existing file is replaced only when it is itself an official Symbols vector (an earlier run,
// perhaps another style); anything else is the user's and stops the run.
function replaceable(abs) {
  try {
    return xmlVectorIcon(readFileSync(abs, 'utf8'))?.official === true;
  } catch {
    return false;
  }
}

// composeIcons({ projectDir, names, style, styled, notice, fill }) -> { files, style, notice? } or { exitCode, error, ... }
// `styled` = verified Rounded or Sharp icons (Map name -> { fill0, fill1, mirror }, from fetchStyleIcons);
// without it the bundled Outlined icons are used and `notice` (or the offline one) says so.
export function composeIcons({ projectDir, names, style = 'outlined', styled, notice, fill = [0, 1] }) {
  const wanted = style !== 'outlined';
  const used = wanted && styled ? style : 'outlined';
  const unique = [...new Set(names)].sort();
  const source = used === 'outlined' ? loadTsv(unique) : styled;
  const missing = unique.filter((n) => !source.has(n));
  if (missing.length) return { exitCode: 4, error: 'no official vector drawable for these names', unknown: missing };

  const dir = drawableDir(projectDir);
  const plan = [];
  for (const n of unique) {
    const { fill0, fill1, mirror, small } = source.get(n);
    const [f0, f1] = fileNames(n);
    if (fill.includes(0)) plan.push({ rel: `${dir}/${f0}`, text: renderVector(fill0, { mirror, small }) });
    if (fill.includes(1)) plan.push({ rel: `${dir}/${f1}`, text: renderVector(fill1, { mirror, small }) });
  }
  const conflicts = plan.filter((p) => existsSync(join(projectDir, p.rel)) && !replaceable(join(projectDir, p.rel))).map((p) => p.rel);
  if (conflicts.length) return { exitCode: 3, error: 'a file exists that is not an official Symbols vector; the script never overwrites it', conflicts };
  for (const p of plan) {
    const abs = join(projectDir, p.rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, p.text);
  }
  const out = { files: plan.map((p) => posix(p.rel)), style: used };
  if (wanted && used === 'outlined') out.notice = notice ?? fallbackNotice(style);
  return out;
}

const RAW = 'https://raw.githubusercontent.com/google/material-design-icons';
export const xmlUrl = (commit, style, name, fill1) => `${RAW}/${commit}/symbols/android/${name}/materialsymbols${style}/${name}${fill1 ? '_fill1' : ''}_24px.xml`;
const MAX_XML = 64 * 1024;

async function fetchText(url, fetchImpl, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: ctl.signal });
    if (!res.ok) throw new StyleFontError('http', `${url}: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_XML) throw new StyleFontError('mismatch', `${url}: ${buf.length} bytes is not an icon`);
    return buf.toString('utf8');
  } catch (e) {
    if (e instanceof StyleFontError) throw e;
    throw new StyleFontError('offline', `download failed: ${e?.message ?? e}`);
  } finally {
    clearTimeout(timer);
  }
}

// Downloads the official XML of each icon (FILL 0 and FILL 1) in one style at the pinned commit. Every
// file must be in the official form and every path must hash into symbols-paths.json, else
// StyleFontError('mismatch'). Nothing is written here: unverified XML cannot reach disk.
export async function fetchStyleIcons({ style, names, fetchImpl = fetch, timeoutMs = 30000, commit = JSON.parse(readFileSync(VERSIONS_FILE, 'utf8')).symbols.commit }) {
  const out = new Map();
  for (const name of names) {
    const pair = [];
    let flags = {};
    for (const fill1 of [false, true]) {
      const url = xmlUrl(commit, style, name, fill1);
      const parsed = parseVector(await fetchText(url, fetchImpl, timeoutMs));
      const bad = !parsed || (pair.length && flagsOf(parsed) !== flagsOf(flags))
        || parsed.paths.some((d) => { const abs = normalizePath(d); return !abs || !isOfficial(abs); });
      if (bad) throw new StyleFontError('mismatch', `${url}: not an official Material Symbols vector`);
      flags = parsed;
      pair.push(parsed.paths);
    }
    out.set(name, { fill0: pair[0], fill1: pair[1], mirror: flags.mirror, small: flags.small });
  }
  return out;
}

async function resolveStyleIcons(opts) {
  try {
    return { icons: await fetchStyleIcons(opts) };
  } catch (e) {
    return { notice: fallbackNotice(opts.style, e) };
  }
}

// Registration for the icons CLI: Rounded and Sharp are downloaded and verified first.
export async function composeBackend({ projectDir, names, style = 'outlined', fill, fetchImpl, timeoutMs }) {
  let styled;
  let notice;
  if (style !== 'outlined') {
    const r = await resolveStyleIcons({ style, names: [...new Set(names)].sort(), fetchImpl, timeoutMs });
    styled = r.icons;
    notice = r.notice;
  }
  return composeIcons({ projectDir, names, style, styled, notice, fill });
}

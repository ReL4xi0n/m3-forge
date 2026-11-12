// Public-diff guard: pure checks used by the CLI, the pre-commit hook and CI.
import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, extname, dirname } from 'node:path';

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'bmp', 'tif', 'tiff']);
const ALLOWED_IMAGE_PATTERNS = [
  /^harness\/(?:[^/]+\/)*references\//,
  /^harness\/(?:[^/]+\/)*goldens\//,
  /^examples\//,
  /^docs\/images\//,
];
const CORPUS_EXTS = new Set(['.txt', '.md', '.html', '.htm', '.json']);
const ALLOWLISTABLE = new Set(['raw-overlap', 'forbidden-term']);
const SHINGLE_SIZE = 12;

export function normalizePath(p) {
  let s = String(p).replace(/\\/g, '/');
  while (s.startsWith('./')) s = s.slice(2);
  return s;
}

export function isPrivatePath(p) {
  return normalizePath(p).split('/')[0].toLowerCase() === 'private';
}

export function isImagePath(p) {
  return IMAGE_EXTS.has(extname(normalizePath(p)).slice(1).toLowerCase());
}

export function isAllowedImagePath(p) {
  const s = normalizePath(p).toLowerCase();
  return ALLOWED_IMAGE_PATTERNS.some(re => re.test(s));
}

export function isBinary(buf) {
  return buf.subarray(0, 8000).includes(0);
}

function words(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(Boolean);
}

function hashWindow(ws) {
  return createHash('sha1').update(ws.join(' ')).digest('hex').slice(0, 16);
}

function* windows(text, n) {
  const ws = words(text);
  for (let i = 0; i + n <= ws.length; i++) yield ws.slice(i, i + n);
}

export function shingles(text, n = SHINGLE_SIZE) {
  const out = new Set();
  for (const w of windows(text, n)) out.add(hashWindow(w));
  return out;
}

async function listCorpusFiles(rawDir) {
  try {
    if (!(await stat(rawDir)).isDirectory()) return null;
  } catch {
    return null;
  }
  const out = [];
  async function walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const abs = join(dir, e.name);
      if (e.isDirectory()) await walk(abs);
      else if (e.isFile() && CORPUS_EXTS.has(extname(e.name).toLowerCase())) {
        const st = await stat(abs);
        out.push({ abs, rel: normalizePath(relative(rawDir, abs)), size: st.size, mtimeMs: st.mtimeMs });
      }
    }
  }
  await walk(rawDir);
  out.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  return out;
}

function collectStrings(value, out) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(v => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(v => collectStrings(v, out));
  return out;
}

async function corpusTexts(file) {
  const raw = await readFile(file.abs, 'utf8');
  const ext = extname(file.abs).toLowerCase();
  if (ext === '.json') {
    try {
      return collectStrings(JSON.parse(raw), []);
    } catch {
      return [raw];
    }
  }
  if (ext === '.html' || ext === '.htm') return [raw.replace(/<[^>]*>/g, ' ')];
  return [raw];
}

async function buildFromFiles(files) {
  const set = new Set();
  for (const f of files) for (const t of await corpusTexts(f)) for (const h of shingles(t)) set.add(h);
  return set;
}

export async function buildCorpus(rawDir) {
  const files = await listCorpusFiles(rawDir);
  return files ? buildFromFiles(files) : null;
}

export async function loadCorpus(rawDir, cacheFile) {
  const files = await listCorpusFiles(rawDir);
  if (!files) return { corpus: null, fromCache: false };
  const fingerprint = createHash('sha256')
    .update(files.map(f => `${f.rel}|${f.size}|${f.mtimeMs}`).join('\n'))
    .digest('hex');
  try {
    const cached = JSON.parse(await readFile(cacheFile, 'utf8'));
    if (cached && cached.fingerprint === fingerprint && Array.isArray(cached.shingles)) {
      return { corpus: new Set(cached.shingles), fromCache: true };
    }
  } catch {
    // missing or corrupt cache: rebuild below
  }
  const corpus = await buildFromFiles(files);
  await mkdir(dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, JSON.stringify({ fingerprint, shingles: [...corpus] }));
  return { corpus, fromCache: false };
}

export async function loadAllowlist(file) {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
  const entries = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const n = i + 1;
    if (!line.trim() || line.trimStart().startsWith('#')) return;
    const parts = line.split('\t');
    if (parts.length !== 4) throw new Error(`allowlist line ${n}: expected 4 tab-separated fields`);
    const [rule, path, key, reason] = parts.map(s => s.trim());
    if (!ALLOWLISTABLE.has(rule)) throw new Error(`allowlist line ${n}: rule "${rule}" cannot be allowlisted`);
    if (!path) throw new Error(`allowlist line ${n}: empty path`);
    if (rule === 'raw-overlap' && !/^[0-9a-f]{16}$/.test(key)) throw new Error(`allowlist line ${n}: raw-overlap key must be 16 hex chars`);
    if (rule === 'forbidden-term' && key !== '*') throw new Error(`allowlist line ${n}: forbidden-term key must be *`);
    if (reason.length < 10) throw new Error(`allowlist line ${n}: reason must be at least 10 characters`);
    entries.push({ rule, path: normalizePath(path), key, reason });
  });
  return entries;
}

export function checkFiles({ files, forbiddenTerms, corpus, allowlist = [] }) {
  const allowed = new Set(allowlist.map(a => `${a.rule}\t${a.path}\t${a.key}`));
  const isAllowed = (rule, path, key) => allowed.has(`${rule}\t${path}\t${key}`);
  const terms = (forbiddenTerms || []).map(t => t.trim().toLowerCase()).filter(Boolean);
  const violations = [];

  for (const file of files) {
    const path = normalizePath(file.path);
    if (isPrivatePath(path)) {
      violations.push({ rule: 'private-path', path, key: '-', detail: 'files under private/ must never be committed' });
    }
    if (isImagePath(path) && !isAllowedImagePath(path)) {
      violations.push({ rule: 'foreign-image', path, key: '-', detail: 'image outside allowed folders' });
    }
    if (file.gitlink) {
      violations.push({ rule: 'gitlink', path, key: '-', detail: 'embedded repository / submodule entries are not allowed' });
    }
    if (file.content == null || isBinary(file.content)) continue;
    const text = file.content.toString('utf8');
    const lower = text.toLowerCase();
    terms.forEach((t, i) => {
      if (lower.includes(t) && !isAllowed('forbidden-term', path, '*')) {
        violations.push({ rule: 'forbidden-term', path, key: '*', detail: `forbidden term #${i + 1}` });
      }
    });
    if (corpus && corpus.size) {
      let first = null;
      let count = 0;
      for (const w of windows(text, SHINGLE_SIZE)) {
        const key = hashWindow(w);
        if (corpus.has(key) && !isAllowed('raw-overlap', path, key)) {
          count++;
          if (!first) first = { key, w };
        }
      }
      if (first) {
        violations.push({
          rule: 'raw-overlap', path, key: first.key,
          detail: `"${first.w.slice(0, 6).join(' ')} …" (${count} matching ${SHINGLE_SIZE}-word run${count === 1 ? '' : 's'})`,
        });
      }
    }
  }
  return violations;
}

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
// Bump when text normalization or shingling changes, so cached corpora are rebuilt.
export const CORPUS_VERSION = '4';
const SCRAPER_FILES = new Set(['state.json', 'meta.json']);

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

function utf16be(buf) {
  const even = Buffer.from(buf.subarray(0, buf.length - (buf.length % 2)));
  return even.swap16().toString('utf16le');
}

// Text content of a blob, or null for binary data. UTF-16 is decoded because Windows PowerShell 5.1
// writes it by default (`>`, Out-File), and NUL bytes would otherwise make it look binary.
export function decodeText(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.subarray(2).toString('utf16le');
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) return utf16be(buf.subarray(2));
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.subarray(3).toString('utf8');
  const head = buf.subarray(0, 8000);
  if (!head.includes(0)) return buf.toString('utf8');
  let odd = 0;
  let even = 0;
  for (let i = 0; i < head.length; i++) if (head[i] === 0) (i % 2 ? odd++ : even++);
  const min = Math.max(1, Math.floor(head.length / 2) * 0.3);
  if (even === 0 && odd >= min) return buf.toString('utf16le');
  if (odd === 0 && even >= min) return utf16be(buf);
  return null;
}

const NOREPLY = /^(?:\d+\+)?[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?@users\.noreply\.github\.com$/;

export function isNoreplyEmail(email) {
  return NOREPLY.test(String(email || '').trim());
}

function lowerTerms(forbiddenTerms) {
  return (forbiddenTerms || []).map(t => t.trim().toLowerCase()).filter(Boolean);
}

function maskTerms(s, terms) {
  let out = s;
  terms.forEach((t, i) => {
    let at;
    while ((at = out.toLowerCase().indexOf(t)) !== -1) out = out.slice(0, at) + `<term #${i + 1}>` + out.slice(at + t.length);
  });
  return out;
}

// Commit metadata: author/committer must be GitHub noreply addresses, messages must not contain terms.
// Details never echo the email or the term (CI logs are public).
export function checkCommitMeta({ sha, authorEmail, committerEmail, message }, forbiddenTerms) {
  const short = String(sha).slice(0, 7);
  const v = [];
  if (!isNoreplyEmail(authorEmail)) v.push({ rule: 'commit-email', path: short, key: '-', detail: 'author email is not a GitHub noreply address' });
  if (!isNoreplyEmail(committerEmail)) v.push({ rule: 'commit-email', path: short, key: '-', detail: 'committer email is not a GitHub noreply address' });
  const lower = String(message || '').toLowerCase();
  lowerTerms(forbiddenTerms).forEach((t, i) => {
    if (lower.includes(t)) v.push({ rule: 'forbidden-term', path: short, key: '-', detail: `forbidden term #${i + 1} in commit message` });
  });
  return v;
}

export function checkRefName(ref, forbiddenTerms) {
  const lower = String(ref).toLowerCase();
  const v = [];
  lowerTerms(forbiddenTerms).forEach((t, i) => {
    if (lower.includes(t)) v.push({ rule: 'forbidden-term', path: 'ref', key: '-', detail: `forbidden term #${i + 1} in ref name` });
  });
  return v;
}

// Prose words only: token identifiers (md.ref/sys/comp.*, m3_*) are facts shared with the Apache-2.0
// token repositories (the site's JSON embeds the same token database), and numbers / one-letter
// fragments (e.g. SVG path data) are not prose.
const TOKEN_ID = /\b(?:md\.(?:ref|sys|comp)\.[a-z0-9.\-_]+|m3_[a-z0-9_]+)/gi;

function words(text) {
  return text.toLowerCase().replace(TOKEN_ID, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ')
    .filter(w => w.length > 1 && !/^\p{N}+$/u.test(w));
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
      // The scraper's own bookkeeping (meta/, state.json, per-page meta.json) is not site text.
      if (e.isDirectory()) {
        if (e.name !== 'meta') await walk(abs);
      } else if (e.isFile() && !SCRAPER_FILES.has(e.name) && CORPUS_EXTS.has(extname(e.name).toLowerCase())) {
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
  const fingerprint = fingerprintOf(files, `corpus v${CORPUS_VERSION} n=${SHINGLE_SIZE}`);
  const cached = await readCache(cacheFile, fingerprint, 'shingles');
  if (cached) return { corpus: new Set(cached), fromCache: true };
  const corpus = await buildFromFiles(files);
  await writeCache(cacheFile, { fingerprint, shingles: [...corpus] });
  return { corpus, fromCache: false };
}

function fingerprintOf(files, salt) {
  return createHash('sha256')
    .update([salt, ...files.map(f => `${f.rel}|${f.size}|${f.mtimeMs}`)].join('\n'))
    .digest('hex');
}

async function readCache(cacheFile, fingerprint, field) {
  try {
    const cached = JSON.parse(await readFile(cacheFile, 'utf8'));
    if (cached && cached.fingerprint === fingerprint && Array.isArray(cached[field])) return cached[field];
  } catch {
    // missing or corrupt cache: caller rebuilds
  }
  return null;
}

async function writeCache(cacheFile, data) {
  await mkdir(dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, JSON.stringify(data));
}

// SHA-256 of every non-empty file under private/ (except .git/ and .guard-cache/), so a byte-identical
// copy of a private file (a screenshot, a raw page) is caught anywhere in the public repo.
export async function loadPrivateHashes(privateDir, cacheFile) {
  try {
    if (!(await stat(privateDir)).isDirectory()) return null;
  } catch {
    return null;
  }
  const files = [];
  async function walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const abs = join(dir, e.name);
      if (e.isDirectory()) {
        if (dir === privateDir && (e.name === '.git' || e.name === '.guard-cache')) continue;
        await walk(abs);
      } else if (e.isFile()) {
        const st = await stat(abs);
        if (st.size > 0) files.push({ abs, rel: normalizePath(relative(privateDir, abs)), size: st.size, mtimeMs: st.mtimeMs });
      }
    }
  }
  await walk(privateDir);
  files.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  const fingerprint = fingerprintOf(files, 'private-hashes v1');
  const cached = await readCache(cacheFile, fingerprint, 'hashes');
  if (cached) return new Set(cached);
  const hashes = new Set();
  for (const f of files) hashes.add(createHash('sha256').update(await readFile(f.abs)).digest('hex'));
  await writeCache(cacheFile, { fingerprint, hashes: [...hashes] });
  return hashes;
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

export function checkFiles({ files, forbiddenTerms, corpus, allowlist = [], privateHashes = null }) {
  const allowed = new Set(allowlist.map(a => `${a.rule}\t${a.path}\t${a.key}`));
  const isAllowed = (rule, path, key) => allowed.has(`${rule}\t${path}\t${key}`);
  const terms = lowerTerms(forbiddenTerms);
  const violations = [];

  for (const file of files) {
    const path = normalizePath(file.path);
    const lowerPath = path.toLowerCase();
    terms.forEach((t, i) => {
      if (lowerPath.includes(t)) {
        violations.push({ rule: 'forbidden-term', path: maskTerms(path, terms), key: '-', detail: `forbidden term #${i + 1} in path` });
      }
    });
    if (isPrivatePath(path)) {
      violations.push({ rule: 'private-path', path, key: '-', detail: 'files under private/ must never be committed' });
    }
    if (isImagePath(path) && !isAllowedImagePath(path)) {
      violations.push({ rule: 'foreign-image', path, key: '-', detail: 'image outside allowed folders' });
    }
    if (file.gitlink) {
      violations.push({ rule: 'gitlink', path, key: '-', detail: 'embedded repository / submodule entries are not allowed' });
    }
    if (file.content == null) continue;
    if (privateHashes && file.content.length > 0
      && privateHashes.has(createHash('sha256').update(file.content).digest('hex'))) {
      violations.push({ rule: 'private-copy', path, key: '-', detail: 'byte-identical to a file in private/' });
    }
    const text = decodeText(file.content);
    if (text == null) continue;
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

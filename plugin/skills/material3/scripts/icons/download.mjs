// Download of the Rounded and Sharp Material Symbols variable fonts at the commit pinned in
// versions.json (`symbols`). The bytes are checked against the pinned size and SHA-256 before
// anything is returned, and this module never writes a file: unverified bytes cannot reach disk.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const VERSIONS_FILE = fileURLToPath(new URL('../../versions.json', import.meta.url));
export const STYLES = ['outlined', 'rounded', 'sharp'];
export const label = (style) => style[0].toUpperCase() + style.slice(1);

// code: 'offline' (network error, timeout), 'http' (non-2xx), 'mismatch' (size or hash), 'unknown-style'.
export class StyleFontError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'StyleFontError';
    this.code = code;
  }
}

export function styleSpec(style, versions = JSON.parse(readFileSync(VERSIONS_FILE, 'utf8'))) {
  const entry = versions.symbols?.styles?.[style];
  if (!entry) throw new StyleFontError('unknown-style', `no pinned font for style "${style}"`);
  return { ...entry, url: entry.url.replace('{commit}', versions.symbols.commit) };
}

// fetchStyleFont({ style, fetchImpl, timeoutMs, expected }) -> Buffer (verified)
// `expected` ({ url, sha256, bytes }) overrides versions.json; tests use it with a stub font.
export async function fetchStyleFont({ style, fetchImpl = fetch, timeoutMs = 120000, expected } = {}) {
  const spec = expected ?? styleSpec(style);
  let buf;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(spec.url, { signal: ctl.signal });
    if (!res.ok) throw new StyleFontError('http', `${spec.url}: HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    if (e instanceof StyleFontError) throw e;
    throw new StyleFontError('offline', `download failed: ${e?.message ?? e}`);
  } finally {
    clearTimeout(timer);
  }
  if (buf.length !== spec.bytes) {
    throw new StyleFontError('mismatch', `${style}: expected ${spec.bytes} bytes, got ${buf.length}`);
  }
  const sha = createHash('sha256').update(buf).digest('hex');
  if (sha !== spec.sha256) throw new StyleFontError('mismatch', `${style}: sha256 ${sha} does not match the pinned ${spec.sha256}`);
  return buf;
}

export function fallbackNotice(style, error) {
  const why = error?.code === 'mismatch' ? 'failed verification' : 'could not be downloaded (offline?)';
  return `${label(style)} icons requested but ${why}; used bundled Outlined. Re-run with network access to switch.`;
}

// resolveStyleFont(opts) -> { font: Buffer } on success, { notice } on any failure.
export async function resolveStyleFont(opts) {
  try {
    return { font: await fetchStyleFont(opts) };
  } catch (e) {
    return { notice: fallbackNotice(opts.style, e) };
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { StyleFontError, fallbackNotice, fetchStyleFont, styleSpec } from '../download.mjs';
import { webIcons } from '../web.mjs';
import { flutterIcons } from '../flutter.mjs';
import { icons } from '../index.mjs';

const VERSIONS = JSON.parse(readFileSync(new URL('../../../versions.json', import.meta.url), 'utf8'));
const STUB = Buffer.from('not a real font, 32 bytes long!!');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const expected = { url: 'https://example.invalid/font.ttf', sha256: sha(STUB), bytes: STUB.length };
const okFetch = (body) => async () => ({ ok: true, status: 200, arrayBuffer: async () => body });
const tmp = (name) => mkdtempSync(join(tmpdir(), `m3 ${name} `));

test('versions.json: Rounded and Sharp are pinned consistently', () => {
  const commit = VERSIONS.symbols.commit;
  assert.match(commit, /^[0-9a-f]{40}$/);
  for (const style of ['rounded', 'sharp']) {
    const s = VERSIONS.symbols.styles[style];
    assert.match(s.sha256, /^[0-9a-f]{64}$/);
    assert.ok(Number.isInteger(s.bytes) && s.bytes > 1e6);
    assert.equal(s.license, 'Apache-2.0');
    assert.ok(s.url.includes('{commit}') && s.url.includes(`MaterialSymbols${style[0].toUpperCase()}${style.slice(1)}`));
    assert.ok(styleSpec(style).url.includes(commit) && !styleSpec(style).url.includes('{commit}'));
  }
  const cp = VERSIONS.fonts.find((f) => f.file === 'MaterialSymbolsOutlined.codepoints');
  assert.match(VERSIONS.symbols.styles.rounded.codepoints, new RegExp(cp.sha256));
});

test('fetchStyleFont: success returns the verified bytes', async () => {
  const buf = await fetchStyleFont({ style: 'rounded', fetchImpl: okFetch(STUB), expected });
  assert.ok(buf.equals(STUB));
});

test('fetchStyleFont: hash or size mismatch throws a typed error', async () => {
  const bad = Buffer.from(STUB);
  bad[0] ^= 1;
  await assert.rejects(fetchStyleFont({ style: 'sharp', fetchImpl: okFetch(bad), expected }),
    (e) => e instanceof StyleFontError && e.code === 'mismatch');
  await assert.rejects(fetchStyleFont({ style: 'sharp', fetchImpl: okFetch(Buffer.concat([STUB, STUB])), expected }),
    (e) => e.code === 'mismatch');
});

test('fetchStyleFont: offline and HTTP errors throw typed errors', async () => {
  await assert.rejects(fetchStyleFont({ style: 'rounded', fetchImpl: async () => { throw new TypeError('fetch failed'); }, expected }),
    (e) => e instanceof StyleFontError && e.code === 'offline');
  await assert.rejects(fetchStyleFont({ style: 'rounded', fetchImpl: async () => ({ ok: false, status: 404 }), expected }),
    (e) => e.code === 'http');
});

test('notices', () => {
  assert.equal(fallbackNotice('rounded', new StyleFontError('offline', 'x')),
    'Rounded icons requested but could not be downloaded (offline?); used bundled Outlined. Re-run with network access to switch.');
  assert.equal(fallbackNotice('sharp', new StyleFontError('mismatch', 'x')),
    'Sharp icons requested but failed verification; used bundled Outlined. Re-run with network access to switch.');
});

test('icons(): offline or failed verification falls back to Outlined with the notice', async () => {
  const dir = tmp('style dl');
  const down = async () => { throw new TypeError('fetch failed'); };
  try {
    const f = await icons({ projectDir: dir, platform: 'flutter', names: ['home'], style: 'rounded', fetchImpl: down });
    assert.equal(f.style, 'outlined');
    assert.equal(f.notice, 'Rounded icons requested but could not be downloaded (offline?); used bundled Outlined. Re-run with network access to switch.');
    assert.match(f.pubspecEdit, /MaterialSymbolsOutlined/);
    const w = await icons({ projectDir: dir, platform: 'web', names: ['home'], style: 'sharp', fetchImpl: down });
    assert.equal(w.style, 'outlined');
    assert.match(w.notice, /^Sharp icons requested but could not be downloaded/);
    const m = await icons({ projectDir: dir, platform: 'flutter', names: ['home'], style: 'sharp', fetchImpl: okFetch(STUB) });
    assert.match(m.notice, /^Sharp icons requested but failed verification;/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('flutterIcons with verified style bytes: family, font file and pubspec follow the style', () => {
  const dir = tmp('style fl');
  try {
    const r = flutterIcons({ projectDir: dir, names: ['home'], style: 'rounded', styleFont: STUB });
    assert.equal(r.style, 'rounded');
    assert.equal(r.notice, undefined);
    assert.equal(r.font, 'assets/fonts/MaterialSymbolsRounded.ttf');
    assert.equal(r.pubspecEdit, '    - family: MaterialSymbolsRounded\n      fonts:\n        - asset: assets/fonts/MaterialSymbolsRounded.ttf');
    assert.ok(readFileSync(join(dir, r.font)).equals(STUB));
    assert.match(readFileSync(join(dir, r.dartFile), 'utf8'), /IconData\(0x[0-9a-f]+, fontFamily: 'MaterialSymbolsRounded'\)/);
    assert.deepEqual(readdirSync(join(dir, 'assets/fonts')), ['MaterialSymbolsRounded.ttf']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('webIcons without style bytes falls back to the bundled font with the notice', () => {
  const dir = tmp('style web');
  try {
    const r = webIcons({ projectDir: dir, names: ['home'], style: 'rounded' });
    assert.equal(r.style, 'outlined');
    assert.match(r.notice, /^Rounded icons requested but could not be downloaded/);
    assert.equal(webIcons({ projectDir: dir, names: ['home'] }).notice, undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('webIcons with style bytes subsets that font (the bundled TTF stands in for a download)', () => {
  const dir = tmp('style web2');
  try {
    const ttf = readFileSync(new URL('../../../assets/fonts/MaterialSymbolsOutlined.ttf', import.meta.url));
    const r = webIcons({ projectDir: dir, names: ['home', 'check'], style: 'sharp', styleFont: ttf });
    assert.equal(r.style, 'sharp');
    assert.equal(r.notice, undefined);
    assert.ok(r.woff2.endsWith('MaterialSymbolsOutlined.woff2'));
    assert.ok(r.subset ? r.bytes < 200000 : r.bytes > 1e6);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

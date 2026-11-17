import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';

import { FULL_WOFF2, WASM_FILE, subsetFont, webIcons } from '../web.mjs';
import { loadCodepoints } from '../names.mjs';
import { readCmap, readSfnt } from '../sfnt.mjs';
import { icons } from '../index.mjs';

const INDEX = fileURLToPath(new URL('../index.mjs', import.meta.url));
const NAMES = ['favorite', 'star', 'add', 'close', 'check', 'edit', 'share', 'info', 'warning', 'person', 'mail', 'call',
  'event', 'lock', 'work', 'build', 'language', 'done', 'delete', 'menu'];
const toolchain = process.env.M3_TOOLCHAIN_TESTS !== '1' && 'needs the local toolchain (M3_TOOLCHAIN_TESTS=1)';
const noBrowser = process.env.M3_NO_BROWSER_TESTS === '1' && 'M3_NO_BROWSER_TESTS=1';

const sub = subsetFont(NAMES);
const tables = new Map(readSfnt(sub.ttf).tables.map((t) => [t.tag, t.data]));

// Ligature sequences (glyph ids) of GSUB lookup 0 of the subset.
function ligatureSequences(gsub) {
  const lookupList = gsub.readUInt16BE(8);
  const lookup0 = lookupList + gsub.readUInt16BE(lookupList + 2);
  const seqs = [];
  for (let s = 0; s < gsub.readUInt16BE(lookup0 + 4); s++) {
    let st = lookup0 + gsub.readUInt16BE(lookup0 + 6 + 2 * s);
    if (gsub.readUInt16BE(lookup0) === 7) st += gsub.readUInt32BE(st + 4);
    const cov = st + gsub.readUInt16BE(st + 2);
    const firsts = Array.from({ length: gsub.readUInt16BE(cov + 2) }, (_, i) => gsub.readUInt16BE(cov + 4 + 2 * i));
    for (let i = 0; i < gsub.readUInt16BE(st + 4); i++) {
      const set = st + gsub.readUInt16BE(st + 6 + 2 * i);
      for (let j = 0; j < gsub.readUInt16BE(set); j++) {
        const lig = set + gsub.readUInt16BE(set + 2 + 2 * (j + 0));
        const n = gsub.readUInt16BE(lig + 2);
        seqs.push([firsts[i], ...Array.from({ length: n - 1 }, (_, k) => gsub.readUInt16BE(lig + 4 + 2 * k))].join(','));
      }
    }
  }
  return seqs;
}
const idsOf = (name, cmap) => [...name].map((c) => cmap.get(c.codePointAt(0)));

test('the subset keeps the FILL, wght, GRAD and opsz axes', () => {
  const fvar = tables.get('fvar');
  const axes = readFvarTags(fvar);
  assert.deepEqual([...axes].sort(), ['FILL', 'GRAD', 'opsz', 'wght']);
  assert.ok(tables.has('gvar'), 'variation data kept');
});

function readFvarTags(fvar) {
  const off = fvar.readUInt16BE(4);
  const count = fvar.readUInt16BE(8);
  const size = fvar.readUInt16BE(10);
  return Array.from({ length: count }, (_, i) => fvar.toString('latin1', off + i * size, off + i * size + 4));
}

test('the subset has a glyph and a ligature for every requested name', () => {
  const cmap = readCmap(tables.get('cmap'));
  const seqs = new Set(ligatureSequences(tables.get('GSUB')));
  const map = loadCodepoints();
  for (const n of NAMES) {
    assert.ok(cmap.has(parseInt(map.get(n), 16)), `${n}: code point`);
    assert.ok(seqs.has(idsOf(n, cmap).join(',')), `${n}: ligature`);
  }
  assert.equal(seqs.size, NAMES.length, 'exactly the requested ligatures');
});

test('no glyph for a ligature that was not asked for, even when its letters are kept', () => {
  const cmap = readCmap(tables.get('cmap'));
  const seqs = new Set(ligatureSequences(tables.get('GSUB')));
  const map = loadCodepoints();
  const asked = new Set(NAMES.map((n) => map.get(n))); // aliases share a code point
  const typable = [...map.keys()].filter((n) => !NAMES.includes(n) && !asked.has(map.get(n)) && idsOf(n, cmap).every((g) => g !== undefined));
  assert.ok(typable.length > 50, `${typable.length} other names could be typed with the kept letters`);
  for (const n of typable) {
    assert.ok(!seqs.has(idsOf(n, cmap).join(',')), `${n}: ligature`);
    assert.ok(!cmap.has(parseInt(map.get(n), 16)), `${n}: code point`);
  }
  const { maxp } = Object.fromEntries([...tables].map(([k, v]) => [k, v]));
  assert.ok(maxp.readUInt16BE(4) < NAMES.length * 2 + 30, 'about one glyph per icon, plus the letters');
});

test('the woff2 wrapper is a well-formed woff2 that decodes to the subset tables', () => {
  const w = sub.woff2;
  assert.equal(w.toString('latin1', 0, 4), 'wOF2');
  assert.equal(w.readUInt32BE(8), w.length);
  const n = w.readUInt16BE(12);
  let o = 48;
  const lens = [];
  for (let i = 0; i < n; i++) {
    const flags = w[o++];
    if ((flags & 63) === 63) o += 4;
    let v = 0;
    for (;;) { const b = w[o++]; v = v * 128 + (b & 127); if (!(b & 128)) break; }
    lens.push(v);
  }
  const raw = brotliDecompressSync(w.subarray(o, o + w.readUInt32BE(20)));
  assert.equal(raw.length, lens.reduce((a, b) => a + b, 0));
});

// A woff2 file ends on a 4-byte boundary: the compressed block starts right after the table directory
// (any offset) and is padded so that its END is 4-byte aligned. Browsers (OTS) reject a file that is
// not ("Failed to convert WOFF 2.0 font to SFNT") and every icon then shows as its ligature name.
// This name set (an expense report) gives a 102-byte header plus directory, so padding the compressed
// length alone left the file 2 bytes short of alignment.
const UNALIGNED_DIR_NAMES = ['receipt_long', 'add', 'content_copy', 'delete', 'attach_file', 'upload_file', 'close',
  'arrow_drop_down', 'send', 'check_circle', 'error', 'flight', 'restaurant', 'hotel', 'inventory_2', 'category',
  'arrow_back', 'currency_exchange', 'image', 'description', 'check', 'info', 'save'];

function woff2Layout(w) {
  let o = 48;
  for (let i = 0; i < w.readUInt16BE(12); i++) {
    const flags = w[o++];
    if ((flags & 63) === 63) o += 4;
    for (;;) { const b = w[o++]; if (!(b & 128)) break; }
  }
  return { dirEnd: o, compEnd: o + w.readUInt32BE(20) };
}

test('the woff2 ends on a 4-byte boundary whatever the directory length', () => {
  for (const names of [NAMES, UNALIGNED_DIR_NAMES, ['favorite'], ['search', 'close', 'shopping_cart']]) {
    const w = subsetFont(names).woff2;
    const { compEnd } = woff2Layout(w);
    assert.equal(w.readUInt32BE(8), w.length, `${names[0]}: header length`);
    assert.equal(w.length % 4, 0, `${names[0]}: file length ${w.length} is 4-byte aligned`);
    assert.equal(w.length, (compEnd + 3) & ~3, `${names[0]}: only the padding follows the compressed block`);
    assert.ok(w.subarray(compEnd).every((b) => b === 0), `${names[0]}: padding is zero`);
  }
  assert.notEqual(woff2Layout(subsetFont(UNALIGNED_DIR_NAMES).woff2).dirEnd % 4, 0, 'the case this guards still occurs');
});

test('the subset of 20 icons is at most 10% of the full woff2', () => {
  const full = statSync(FULL_WOFF2).size;
  assert.ok(sub.woff2.length <= full * 0.1, `${sub.woff2.length} of ${full}`);
});

test('webIcons writes the subset where fonts.css points, in a path with spaces', () => {
  const dir = mkdtempSync(join(tmpdir(), 'm3 icons '));
  try {
    const r = webIcons({ projectDir: dir, names: NAMES, dest: 'assets/m3' });
    assert.equal(r.subset, true);
    assert.equal(r.woff2, join(dir, 'assets/m3/fonts/MaterialSymbolsOutlined.woff2'));
    assert.equal(r.bytes, statSync(r.woff2).size);
    assert.ok(r.bytes <= statSync(FULL_WOFF2).size * 0.1);
    const css = readFileSync(fileURLToPath(new URL('../../../assets/web/fonts.css', import.meta.url)), 'utf8');
    assert.ok(css.includes("url('fonts/MaterialSymbolsOutlined.woff2')"), 'fonts.css is unchanged and points at that name');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('without the wasm the full woff2 is copied and subset is false', () => {
  const dir = mkdtempSync(join(tmpdir(), 'm3 icons '));
  try {
    const r = webIcons({ projectDir: dir, names: NAMES, wasm: join(dir, 'missing.wasm') });
    assert.equal(r.subset, false);
    assert.deepEqual(readFileSync(r.woff2), readFileSync(FULL_WOFF2));
    assert.ok(r.woff2.includes(join('assets', 'm3')), 'no src folder: assets/m3');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the vendored wasm matches the sha256 pinned in versions.json', async () => {
  const { createHash } = await import('node:crypto');
  const v = JSON.parse(readFileSync(fileURLToPath(new URL('../../../versions.json', import.meta.url)), 'utf8'));
  const pin = v.tools.find((t) => t.name === 'harfbuzzjs');
  assert.ok(pin, 'versions.json tools entry');
  assert.equal(createHash('sha256').update(readFileSync(WASM_FILE)).digest('hex'), pin.files['hb-subset.wasm'].sha256);
  assert.ok(existsSync(fileURLToPath(new URL('../vendor/LICENSE-harfbuzzjs.txt', import.meta.url))));
});

test('the icons CLI runs the web back end offline (proxy on a closed port)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'm3 icons '));
  try {
    const p = spawnSync(process.execPath, [INDEX, dir, '--platform', 'web', '--names', 'favorite,star'], {
      encoding: 'utf8',
      env: { ...process.env, HTTPS_PROXY: 'http://127.0.0.1:9', HTTP_PROXY: 'http://127.0.0.1:9' },
    });
    assert.equal(p.status, 0, p.stderr);
    const r = JSON.parse(p.stdout);
    assert.equal(r.subset, true);
    assert.ok(existsSync(r.woff2));
    const viaApi = await icons({ projectDir: dir, platform: 'web', names: ['favorite'], dest: 'out' });
    assert.equal(viaApi.exitCode, 0);
    assert.ok(existsSync(join(dir, 'out/fonts/MaterialSymbolsOutlined.woff2')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a page using the subset renders an icon with FILL 0 and FILL 1', { skip: toolchain || noBrowser, timeout: 120_000 }, async () => {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= join(process.env.M3_TOOLCHAIN || join(homedir(), '.m3-toolchain'), 'ms-playwright');
  const { chromium } = await import('playwright');
  const b64 = sub.woff2.toString('base64');
  const html = (fill, text) => `<style>
    @font-face { font-family: 'Material Symbols Outlined'; src: url(data:font/woff2;base64,${b64}) format('woff2'); font-weight: 100 700; }
    body { margin: 0; background: #fff; color: #000; }
    span { font-family: 'Material Symbols Outlined'; font-size: 96px; line-height: 1; display: inline-block;
      font-variation-settings: 'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 48; }
  </style><span id="i">${text}</span>`;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 200, height: 140 } });
    const shot = async (fill, text) => {
      await page.setContent(html(fill, text));
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      return { png: await page.locator('#i').screenshot(), width: await page.locator('#i').evaluate((e) => e.getBoundingClientRect().width) };
    };
    const outline = await shot(0, 'favorite');
    const filled = await shot(1, 'favorite');
    const missing = await shot(0, 'star_half'); // not requested: stays as text
    assert.ok(outline.width < 140, `ligature collapsed to one glyph (${outline.width}px)`);
    assert.ok(missing.width > 140, 'an icon that was not requested is not rendered as an icon');
    assert.notDeepEqual(outline.png, filled.png, 'FILL 0 and FILL 1 draw differently');
  } finally {
    await browser.close();
  }
});

test('Chromium decodes a subset whose table directory is not 4-byte aligned', { skip: toolchain || noBrowser, timeout: 120_000 }, async () => {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= join(process.env.M3_TOOLCHAIN || join(homedir(), '.m3-toolchain'), 'ms-playwright');
  const { chromium } = await import('playwright');
  const b64 = subsetFont(UNALIGNED_DIR_NAMES).woff2.toString('base64');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>@font-face { font-family: 'MS'; src: url(data:font/woff2;base64,${b64}) format('woff2'); }
      span { font-family: 'MS'; font-size: 24px; display: inline-block; white-space: nowrap; }</style><span id="i">check_circle</span>`);
    const status = await page.evaluate(() => document.fonts.load('24px MS').then(() => [...document.fonts][0].status, () => 'error'));
    assert.equal(status, 'loaded', 'the font decodes');
    const width = await page.locator('#i').evaluate((e) => e.getBoundingClientRect().width);
    assert.ok(width < 40, `check_circle renders as one icon (${width}px)`);
  } finally {
    await browser.close();
  }
});

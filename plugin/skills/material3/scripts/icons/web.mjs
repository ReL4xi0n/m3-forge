// Web back end of the icons script: writes a Material Symbols Outlined font that holds only the
// requested icons, with all four axes (FILL, wght, GRAD, opsz) and the ligature lookup (GSUB liga)
// kept, so `<span class="material-symbols-outlined">name</span>` keeps working.
//
// The subsetter is HarfBuzz hb-subset (vendor/hb-subset.wasm, pinned in versions.json `tools`),
// run through WebAssembly in Node. It returns a TTF; this file wraps it as woff2 itself (brotli from
// node:zlib, glyf and loca stored untransformed, which the woff2 format allows), so the file name and
// format stay exactly what the shipped fonts.css references. Everything is offline.
// Without the wasm file, or when it fails, the full woff2 is copied instead (`subset: false`).
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';
import { loadCodepoints } from './names.mjs';
import { pruneLigatures, readSfnt } from './sfnt.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
export const WASM_FILE = join(HERE, 'vendor', 'hb-subset.wasm');
export const FULL_WOFF2 = join(HERE, '..', '..', 'assets', 'fonts', 'MaterialSymbolsOutlined.woff2');
export const FULL_TTF = join(HERE, '..', '..', 'assets', 'fonts', 'MaterialSymbolsOutlined.ttf');
const FONT_NAME = 'MaterialSymbolsOutlined.woff2';

const isDir = (f) => { try { return statSync(f).isDirectory(); } catch { return false; } };

// ---- hb-subset through WebAssembly -------------------------------------------------------------
const HB_MEMORY_MODE_READONLY = 2;

export function subsetTtf(ttf, codepoints, wasmFile = WASM_FILE) {
  const { exports: x } = new WebAssembly.Instance(new WebAssembly.Module(readFileSync(wasmFile)), {});
  x._initialize?.();
  const u8 = () => new Uint8Array(x.memory.buffer);
  const src = x.malloc(ttf.length);
  u8().set(ttf, src);
  const blob = x.hb_blob_create(src, ttf.length, HB_MEMORY_MODE_READONLY, 0, 0);
  const face = x.hb_face_create(blob, 0);
  const input = x.hb_subset_input_create_or_fail();
  if (!input) throw new Error('hb-subset: cannot create input');
  const unicodes = x.hb_subset_input_unicode_set(input);
  for (const cp of codepoints) x.hb_set_add(unicodes, cp);
  const out = x.hb_subset_or_fail(face, input);
  if (!out) throw new Error('hb-subset: subsetting failed');
  const outBlob = x.hb_face_reference_blob(out);
  const len = x.hb_blob_get_length(outBlob);
  const ptr = x.hb_blob_get_data(outBlob, 0);
  return Buffer.from(u8().slice(ptr, ptr + len));
}

// ---- woff2 wrapper (no glyph transform) --------------------------------------------------------
const KNOWN_TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep',
  'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB',
  'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc',
  'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc',
  'Feat', 'Sill'];

function base128(n) {
  const bytes = [n & 0x7f];
  for (let v = n >>> 7; v > 0; v >>>= 7) bytes.unshift((v & 0x7f) | 0x80);
  return Buffer.from(bytes);
}

export function ttfToWoff2(ttf) {
  const { flavor, tables } = readSfnt(ttf);
  // The format wants loca right after glyf.
  const order = tables.filter((t) => t.tag !== 'loca');
  const g = order.findIndex((t) => t.tag === 'glyf');
  if (g >= 0) order.splice(g + 1, 0, tables.find((t) => t.tag === 'loca'));
  const dir = [];
  let sfntSize = 12 + 16 * order.length;
  for (const t of order) {
    const idx = KNOWN_TAGS.indexOf(t.tag);
    const nullTransform = t.tag === 'glyf' || t.tag === 'loca' ? 0xc0 : 0;
    dir.push(Buffer.from([(idx < 0 ? 63 : idx) | nullTransform]));
    if (idx < 0) dir.push(Buffer.from(t.tag, 'latin1'));
    dir.push(base128(t.data.length));
    sfntSize += (t.data.length + 3) & ~3;
  }
  const packed = brotliCompressSync(Buffer.concat(order.map((t) => t.data)), {
    params: {
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_FONT,
      [constants.BROTLI_PARAM_QUALITY]: 11,
      [constants.BROTLI_PARAM_LGWIN]: 22,
    },
  });
  const directory = Buffer.concat(dir);
  // The compressed block starts right after the directory (any offset); the file ends on a 4-byte
  // boundary, so pad the END of the block, not its length. Browsers reject an unaligned file.
  const total = (48 + directory.length + packed.length + 3) & ~3;
  const head = Buffer.alloc(48);
  head.write('wOF2', 0, 'latin1');
  head.writeUInt32BE(flavor, 4);
  head.writeUInt32BE(total, 8);
  head.writeUInt16BE(order.length, 12);
  head.writeUInt32BE(sfntSize, 16);
  head.writeUInt32BE(packed.length, 20);
  return Buffer.concat([head, directory, packed, Buffer.alloc(total - 48 - directory.length - packed.length)]);
}

// ---- back end ----------------------------------------------------------------------------------
// Characters a ligature name is typed with; the font maps them to the ligature through GSUB liga.
const letters = (names) => new Set([...names.join('')].map((c) => c.codePointAt(0)));

// subsetFont(names) -> { ttf, woff2 } for the requested icons.
export function subsetFont(names, { ttf = FULL_TTF, wasm = WASM_FILE } = {}) {
  const map = loadCodepoints();
  const cps = letters(names);
  for (const n of names) cps.add(parseInt(map.get(n), 16));
  const out = subsetTtf(pruneLigatures(readFileSync(ttf), names), cps, wasm);
  return { ttf: out, woff2: ttfToWoff2(out) };
}

// webIcons({ projectDir, names, dest }) -> { woff2, bytes, subset }
// `dest` is the folder that holds fonts.css (install-assets' web "main" folder); the font goes to
// <dest>/fonts/MaterialSymbolsOutlined.woff2, the path fonts.css already points at.
export function webIcons({ projectDir, names, dest, wasm = WASM_FILE }) {
  const main = dest ?? (isDir(join(projectDir, 'src')) ? 'src/styles/m3' : 'assets/m3');
  const target = join(projectDir, main, 'fonts', FONT_NAME);
  mkdirSync(dirname(target), { recursive: true });
  let buf = null;
  if (existsSync(wasm) && typeof WebAssembly === 'object') {
    try { buf = subsetFont(names, { wasm }).woff2; } catch { buf = null; }
  }
  if (buf) writeFileSync(target, buf);
  else copyFileSync(FULL_WOFF2, target);
  return { woff2: target, bytes: statSync(target).size, subset: !!buf };
}

// Registration for the icons CLI.
export const webBackend = ({ projectDir, names, dest }) => webIcons({ projectDir, names, dest });

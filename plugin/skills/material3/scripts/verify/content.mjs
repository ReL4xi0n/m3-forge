// Content checks that are reported but not scored: placeholder content, brand names and unknown
// Material Symbols names. The scanners pass in the UI strings of each file ({ index, text }, index
// = file offset of the text) and the comment-stripped source.
import { readFileSync } from 'node:fs';

const BRANDS = JSON.parse(readFileSync(new URL('./brands.json', import.meta.url), 'utf8'));

// The codepoints file of the bundled Symbols font, through the icons script. Loaded guarded: if it
// is missing, verify still runs and unknown-icon is not checked.
let codepoints = null;
try {
  const { loadCodepoints } = await import('../icons/names.mjs');
  codepoints = loadCodepoints();
} catch {
  // verify works without the icons script or the codepoints file
}

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------------------------------------------------------------------------------------------
// Placeholder content.

// Anywhere in the source (links, image sources, emails, CSS url()).
const PLACEHOLDER_HOSTS = [
  ['example domain', /(?<![\w-])example\.(?:com|org|net)(?![\w-])/gi],
  ['stock or placeholder image host', new RegExp(`(?<![\\w-])(?:[\\w-]+\\.)*(?:${[
    'unsplash.com', 'picsum.photos', 'placehold.co', 'placehold.it', 'placeholder.com', 'placekitten.com',
    'placeimg.com', 'loremflickr.com', 'lorempixel.com', 'dummyimage.com', 'pexels.com', 'pixabay.com',
    'randomuser.me', 'pravatar.cc', 'fakeimg.pl', 'shutterstock.com', 'istockphoto.com', 'gettyimages.com',
  ].map(esc).join('|')})(?![\\w-])`, 'gi')],
];

// In UI strings only.
const PLACEHOLDER_TEXT = [
  ['lorem ipsum', /\blorem\b|\bipsum\b/i],
  ['"Acme"', /\bAcme\b|\bACME\b/],
  ['John Doe / Jane Doe', /\b(?:John|Jane) Doe\b/i],
  ['foo/bar filler', /\b(?:foo|foobar|baz|qux)\b/i],
  ['foo/bar filler', /^\s*bar\s*$/i],
  ['numbered "Item N" label', /\bItem (?:\d+|\$)/],
];

export function placeholderHosts(src, hit) {
  for (const [what, re] of PLACEHOLDER_HOSTS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) hit('placeholder-content', m.index, `${what} "${m[0]}" (invent content for the product)`);
  }
}

// ---------------------------------------------------------------------------------------------
// Brands.

const BRAND_NAMES = [...BRANDS.names].sort((a, b) => b.length - a.length);
const BRAND_TEXT = new RegExp(
  `(?<![\\w-])(?:${BRAND_NAMES.flatMap(n => [esc(n), esc(n.toUpperCase())]).join('|')})(?![\\w-])`,
);
const COMMON = new Set(BRANDS.commonWords.map(n => n.toLowerCase()));
const BRAND_PARTS = BRAND_NAMES
  .filter(n => !COMMON.has(n.toLowerCase()))
  .map(n => ({ name: n, parts: n.toLowerCase().split(/\s+/) }));

// Name parts of a file name: camelCase and any separator split, lower case.
function nameParts(base) {
  return base
    .replace(/\.[^.]+$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// The brand a file name carries, or null: consecutive name parts that spell the brand without spaces
// (google_pay, googlepay, GooglePay, YouTube, you_tube).
export function brandInFileName(base) {
  const parts = nameParts(base);
  for (const { name, parts: bp } of BRAND_PARTS) {
    const joined = bp.join('');
    for (let i = 0; i < parts.length; i++) {
      let s = '';
      for (let j = i; j < parts.length && s.length < joined.length; j++) {
        s += parts[j];
        if (s === joined) return name;
      }
    }
  }
  return null;
}

const IMAGE_FILE = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp)$/i;
const RES_IMAGE = /(?:^|\/)res\/(?:drawable|mipmap)[^/]*\/[^/]+\.xml$/;

// Image and drawable files whose name carries a brand.
export function brandAssetNames(files) {
  const out = [];
  for (const rel of files) {
    if (!IMAGE_FILE.test(rel) && !RES_IMAGE.test(rel)) continue;
    const brand = brandInFileName(rel.slice(rel.lastIndexOf('/') + 1));
    if (brand) out.push({ rel, brand });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// UI strings: placeholder text and brands.

export function checkStrings(strings, hit) {
  for (const { index, text } of strings) {
    for (const [what, re] of PLACEHOLDER_TEXT) {
      const m = text.match(re);
      if (m) hit('placeholder-content', index + m.index, `${what} in UI text "${clip(text)}" (invent content for the product)`);
    }
    const b = text.match(BRAND_TEXT);
    if (b) hit('brand', index + b.index, `brand name "${b[0]}" in UI text "${clip(text)}"`);
  }
}

const clip = s => {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > 60 ? `${t.slice(0, 57)}...` : t;
};

// ---------------------------------------------------------------------------------------------
// Icon names.

export const iconsChecked = () => codepoints !== null;

const snake = s => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

// A ligature (exact) or a constant name (exact, or camelCase for the snake_case icon name).
export function knownIcon(name, { constant = false } = {}) {
  if (!codepoints) return true;
  return codepoints.has(name) || (constant && codepoints.has(snake(name)));
}

// ---------------------------------------------------------------------------------------------
// String literals of a comment-stripped source: [{ index, text }]. Interpolations stay in the text.

export function stringLiterals(src, { triple = false, backtick = false, quotes = ['"', "'"] } = {}) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (triple && (c === '"' || c === "'") && src[i + 1] === c && src[i + 2] === c) {
      const j = src.indexOf(c.repeat(3), i + 3);
      const end = j === -1 ? src.length : j;
      out.push({ index: i + 3, text: src.slice(i + 3, end) });
      i = end + 3;
      continue;
    }
    if ((backtick && c === '`') || quotes.includes(c)) {
      let j = i + 1;
      while (j < src.length && src[j] !== c && (c === '`' || src[j] !== '\n')) j += src[j] === '\\' ? 2 : 1;
      out.push({ index: i + 1, text: src.slice(i + 1, j) });
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

// Canonical token records shared by every extractor.
//
// TokenRecord: { id, native, source, file, line, kind: 'ref'|'sys'|'comp', mode?, value, raw,
//                derived?, deprecated? }
//   id     the token-database name the source carries (e.g. md.comp.filled-button.container.height);
//          derived:true when we had to build it as md.<kind>.<set>.<kebab-prop>
//   mode   light | dark | light-medium-contrast | ... for sys colors; standard | expressive for springs
// Value:   {dp} {sp} {ms} {number} {hex:'#rrggbbaa'} {ref:id} {easing:[a,b,c,d]} {string} {unparsed}
// Numbers are parsed exactly as written (Number(text)); nothing is rounded or converted except
// px -> dp (equal in M3 tokens).
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

export const kebab = s => String(s)
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
  .toLowerCase();

export const squash = s => String(s).replace(/[.\-_]/g, '').toLowerCase();

export const derivedId = (kind, set, prop) => `md.${kind}.${set}.${prop}`;

const NUM = '(-?\\d+(?:\\.\\d+)?(?:[eE]-?\\d+)?)';

function hex(h) {
  let x = h.toLowerCase();
  if (x.length === 3) x = x.split('').map(c => c + c).join('');
  if (x.length === 6) x += 'ff';
  return `#${x}`;
}

export function normalizeValue(raw, source, name = '') {
  const s = String(raw).trim().replace(/;$/, '').trim();
  let m;
  if ((m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s))) return { hex: hex(m[1]) };
  if ((m = /^Color\(0x([0-9a-f]{2})([0-9a-f]{6})\)$/i.exec(s))) return { hex: `#${m[2].toLowerCase()}${m[1].toLowerCase()}` };
  // Integer channels 0-255 convert to hex exactly; float channels would need rounding -> unparsed.
  if ((m = /^Color\(\s*red\s*=\s*(\d{1,3}),\s*green\s*=\s*(\d{1,3}),\s*blue\s*=\s*(\d{1,3})\s*\)$/.exec(s))
    && m.slice(1).every(c => Number(c) <= 255)) {
    return { hex: `#${m.slice(1).map(c => Number(c).toString(16).padStart(2, '0')).join('')}ff` };
  }
  if ((m = /^(?:cubic-bezier|CubicBezierEasing)\(([^)]*)\)$/.exec(s))) {
    const parts = m[1].split(',').map(p => p.trim().replace(/[fF]$/, ''));
    if (parts.length === 4 && parts.every(p => new RegExp(`^${NUM}$`).test(p))) return { easing: parts.map(Number) };
    return { unparsed: s };
  }
  if ((m = /^'([^']*)'$/.exec(s)) || (m = /^"([^"]*)"$/.exec(s))) return { string: m[1] };
  if ((m = new RegExp(`^${NUM}px$`).exec(s))) return { dp: Number(m[1]) };
  if ((m = new RegExp(`^${NUM}\\.?dp$`).exec(s))) return { dp: Number(m[1]) };
  if ((m = new RegExp(`^${NUM}\\.?sp$`).exec(s))) return { sp: Number(m[1]) };
  if ((m = new RegExp(`^${NUM}ms$`).exec(s))) return { ms: Number(m[1]) };
  if ((m = new RegExp(`^(?:RoundedCornerShape|CornerSize)\\(${NUM}\\.?dp\\)$`).exec(s))) return { dp: Number(m[1]) };
  if ((m = new RegExp(`^${NUM}[fFdDL]?$`).exec(s))) {
    return /^duration/i.test(name) ? { ms: Number(m[1]) } : { number: Number(m[1]) };
  }
  return { unparsed: s };
}

export function buildIndex(records) {
  const idx = new Map();
  for (const r of records) {
    if (!r.id) continue;
    const key = r.mode ? `${r.id}@${r.mode}` : r.id;
    const prev = idx.get(key);
    if (prev && prev.source === r.source) {
      throw new Error(`canonical id collision in ${r.source}: ${prev.native} and ${r.native} -> ${key}`);
    }
    idx.set(key, r);
  }
  return idx;
}

export async function listFiles(dir, test) {
  const out = [];
  async function walk(d) {
    for (const e of await readdir(d, { withFileTypes: true })) {
      const abs = join(d, e.name);
      if (e.isDirectory()) await walk(abs);
      else if (test(e.name)) out.push(abs);
    }
  }
  await walk(dir);
  return out.sort().map(abs => ({ abs, rel: relative(dir, abs).replace(/\\/g, '/') }));
}

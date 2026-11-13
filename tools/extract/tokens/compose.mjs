// Compose material3 tokens (androidx/compose/material3/tokens/*Tokens.kt, sources jar).
// Compose carries no token-database ids, so each `<Object>Tokens.<Prop>` is matched to a known id
// by separator-insensitive comparison (squash). No match or several matches -> derived id.
import { readFile } from 'node:fs/promises';
import { normalizeValue, derivedId, kebab, squash, listFiles } from './model.mjs';

// Object name (without "Tokens") -> where its members live in the token database.
const SYS = {
  ColorLight: { kind: 'sys', set: 'color', mode: 'light' },
  ColorDark: { kind: 'sys', set: 'color', mode: 'dark' },
  ColorSchemeKey: { kind: 'sys', set: 'color' },
  Elevation: { kind: 'sys', set: 'elevation' },
  Shape: { kind: 'sys', set: 'shape' },
  ShapeKey: { kind: 'sys', set: 'shape' },
  TypeScale: { kind: 'sys', set: 'typescale' },
  TypographyKey: { kind: 'sys', set: 'typescale' },
  Typeface: { kind: 'ref', set: 'typeface' },
  Palette: { kind: 'ref', set: 'palette' },
  Motion: { kind: 'sys', set: 'motion' },
  StandardMotion: { kind: 'sys', set: 'motion', scheme: 'standard' },
  ExpressiveMotion: { kind: 'sys', set: 'motion', scheme: 'expressive' },
  MotionSchemeKey: { kind: 'sys', set: 'motion-scheme' },
  State: { kind: 'sys', set: 'state' },
};
const infoOf = obj => SYS[obj] ?? { kind: 'comp', set: kebab(obj) };

function propName(info, prop) {
  return info.set === 'motion' && /^Easing/.test(prop) ? prop.replace(/CubicBezier$/, '') : prop;
}

// Mapping rules, applied in order; a rule maps only when it yields exactly one known id:
//   exact     separator-insensitive equality (FilledButtonTokens.ContainerHeight = md.comp.filled-button.container.height)
//   alias     reviewed prop rewrites from aliases.json ({ "<Object>": { props: [{ pattern, replace }], why } })
//   word-order  the same words in another order (XSmallIconButtonTokens.IconSize = md.comp.icon-button.xsmall.icon.size),
//             after two naming normalizations:
//               N1  X + Small / Large -> xsmall / xlarge
//               N2  Hover / Focus / Press / Drag -> hovered / focused / pressed / dragged
// No rule adds or drops a word. Several candidates -> ambiguous, unmapped.
const N2 = { hover: 'hovered', focus: 'focused', press: 'pressed', drag: 'dragged' };
const SIZES = new Set(['xsmall', 'small', 'medium', 'large', 'xlarge']);

function normWords(words) {
  const out = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w === 'x' && (words[i + 1] === 'small' || words[i + 1] === 'large')) { out.push(`x${words[++i]}`); continue; }
    out.push(N2[w] ?? w);
  }
  return out;
}
const camelWords = s => (String(s).match(/[A-Z][a-z0-9]*|[a-z0-9]+/g) || []).map(w => w.toLowerCase());
const bagKey = words => normWords(words).slice().sort().join(' ');

function resolver(knownIds, aliases = {}) {
  const bySquash = new Map();
  const byBag = new Map();
  for (const id of knownIds) {
    const k = squash(id);
    bySquash.set(k, bySquash.has(k) && bySquash.get(k) !== id ? null : id); // null = ambiguous
    // set part = segment 2 (+ segment 3 when it is a size qualifier); property part = the rest.
    const [, kind, set, ...rest] = id.split('.');
    if (!set || !rest.length) continue;
    const sized = SIZES.has(rest[0]) && rest.length > 1;
    const setWords = [...set.split('-'), ...(sized ? [rest[0]] : [])];
    const propWords = (sized ? rest.slice(1) : rest).join('.').split(/[.-]/);
    const bk = `${kind}|${bagKey(setWords)}|${bagKey(propWords)}`;
    byBag.set(bk, byBag.has(bk) && byBag.get(bk) !== id ? null : id);
  }
  return (obj, prop) => {
    const info = infoOf(obj);
    const p = propName(info, prop);
    const hit = bySquash.get(squash(`md${info.kind}${info.set}${p}`));
    if (hit) return { id: hit, mappedBy: 'exact' };
    for (const rule of aliases[obj]?.props || []) {
      const re = new RegExp(rule.pattern);
      if (!re.test(p)) continue;
      const aliased = bySquash.get(squash(`md${info.kind}${info.set}${p.replace(re, rule.replace)}`));
      if (aliased) return { id: aliased, alias: obj, mappedBy: `alias:${obj}` };
    }
    const setWords = SYS[obj] ? info.set.split('-') : camelWords(obj);
    const bag = byBag.get(`${info.kind}|${bagKey(setWords)}|${bagKey(camelWords(p))}`);
    if (bag) return { id: bag, mappedBy: 'word-order' };
    return { id: derivedId(info.kind, info.set, kebab(p)), derived: true, ambiguous: hit === null || bag === null };
  };
}

const balanced = s => (s.match(/\(/g) || []).length === (s.match(/\)/g) || []).length;

export async function extractCompose(dir, { knownIds = new Set(), aliases = {} } = {}) {
  const resolve = resolver(knownIds, aliases['compose-material3'] || {});
  const files = await listFiles(dir, n => /Tokens\.kt$/.test(n) && !/KeyTokens\.kt$/.test(n));
  const out = [];
  for (const f of files) {
    const lines = (await readFile(f.abs, 'utf8')).split(/\r?\n/);
    const objMatch = lines.map(l => /^(?:internal\s+)?object\s+([A-Za-z0-9]+)Tokens\b/.exec(l)).find(Boolean);
    if (!objMatch) continue;
    const obj = objMatch[1];
    const info = infoOf(obj);
    for (let i = 0; i < lines.length; i++) {
      const decl = /^\s{4}(?:(?:const|inline|internal)\s+)*val\s+([A-Z][A-Za-z0-9]*)\s*(?::\s*[^=]+?)?\s*(?:=\s*(.+))?$/.exec(lines[i]);
      if (!decl) continue;
      const [, prop] = decl;
      let raw = decl[2];
      let j = i;
      if (raw === undefined) {
        const g = /^\s*get\(\)\s*=\s*(.+)$/.exec(lines[i + 1] || '');
        if (!g) continue;
        raw = g[1];
        j = i + 1;
      }
      while (!balanced(raw) && j + 1 < lines.length) raw += ` ${lines[++j].trim()}`;
      raw = raw.trim();
      const target = resolve(obj, prop);
      let value;
      const ref = /^([A-Z][A-Za-z0-9]*)Tokens\.([A-Z][A-Za-z0-9]*)$/.exec(raw);
      if (ref) value = { ref: resolve(ref[1], ref[2]).id };
      else value = normalizeValue(raw, 'compose-material3', prop);
      const mode = info.mode ?? (info.scheme && /^md\.sys\.motion\.spring/.test(target.id) ? info.scheme : undefined);
      out.push({
        id: target.id, native: `${obj}Tokens.${prop}`, source: 'compose-material3', file: f.rel, line: i + 1, kind: info.kind,
        ...(mode ? { mode } : {}), value, raw, ...(target.derived ? { derived: true } : {}), ...(target.ambiguous ? { ambiguous: true } : {}),
        ...(target.alias ? { alias: target.alias } : {}), ...(target.mappedBy ? { mappedBy: target.mappedBy } : {}),
      });
      i = j;
    }
  }
  // Safety net: if a word-order mapping lands on an id another Compose name also uses, drop it.
  const byKey = new Map();
  for (const r of out) {
    const k = r.mode ? `${r.id}@${r.mode}` : r.id;
    byKey.set(k, [...(byKey.get(k) || []), r]);
  }
  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    for (const r of group.filter(x => x.mappedBy === 'word-order')) {
      const info = infoOf(r.native.split('Tokens.')[0]);
      Object.assign(r, { id: derivedId(info.kind, info.set, kebab(propName(info, r.native.split('.')[1]))), derived: true, ambiguous: true });
      delete r.mappedBy;
    }
  }
  return out;
}

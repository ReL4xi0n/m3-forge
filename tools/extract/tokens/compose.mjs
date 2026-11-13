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

// aliases: { "<Object>": { props: [{ pattern, replace }], why } } (reviewed; see aliases.json).
// A rewrite is used only when the rewritten name hits a known id.
function resolver(knownIds, aliases = {}) {
  const bySquash = new Map();
  for (const id of knownIds) {
    const k = squash(id);
    bySquash.set(k, bySquash.has(k) && bySquash.get(k) !== id ? null : id); // null = ambiguous
  }
  return (obj, prop) => {
    const info = infoOf(obj);
    const p = propName(info, prop);
    const hit = bySquash.get(squash(`md${info.kind}${info.set}${p}`));
    if (hit) return { id: hit };
    for (const rule of aliases[obj]?.props || []) {
      const re = new RegExp(rule.pattern);
      if (!re.test(p)) continue;
      const aliased = bySquash.get(squash(`md${info.kind}${info.set}${p.replace(re, rule.replace)}`));
      if (aliased) return { id: aliased, alias: obj };
    }
    return { id: derivedId(info.kind, info.set, kebab(p)), derived: true, ambiguous: hit === null };
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
        ...(target.alias ? { alias: target.alias } : {}),
      });
      i = j;
    }
  }
  return out;
}

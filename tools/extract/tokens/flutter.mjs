// Flutter material_ui gen_defaults data (tool/gen_defaults/data/*.dart): a `/// md.<id>` doc comment
// above each `static const <Type> <name> = <value>;`. Dart doubles carry no unit -> {number}.
import { readFile } from 'node:fs/promises';
import { normalizeValue, derivedId, kebab, squash, listFiles } from './model.mjs';

const TOKEN_SETS = {
  ColorRole: ['sys', 'color'], Typescale: ['sys', 'typescale'], Shape: ['sys', 'shape'], Elevation: ['sys', 'elevation'],
  Motion: ['sys', 'motion'], State: ['sys', 'state'], Palette: ['ref', 'palette'], Typeface: ['ref', 'typeface'],
};
// TypescaleStruct field -> token-database sub-id (same split as material-web).
const TYPESCALE_FIELDS = { fontFamily: 'font', fontSize: 'size', fontWeight: 'weight', lineHeight: 'line-height', letterSpacing: 'tracking' };
const SPRING = /^md\.sys\.motion\.spring\./;

function fields(body) {
  const out = {};
  for (const m of body.matchAll(/(\w+)\s*:\s*('[^']*'|-?\d+(?:\.\d+)?)/g)) out[m[1]] = m[2];
  return out;
}
const num = s => Number(s);
const str = s => s.replace(/^'|'$/g, '');

function modeFor(file, id) {
  const c = /(?:^|\/)color_(light|dark)(?:_(medium|high)_contrast)?\.dart$/.exec(file);
  if (c && id.startsWith('md.sys.color.')) return `${c[1]}${c[2] ? `-${c[2]}-contrast` : ''}`;
  if (SPRING.test(id)) return /motion_expressive\.dart$/.test(file) ? 'expressive' : 'standard';
  return undefined;
}

export async function extractFlutter(dir, { knownIds = new Set() } = {}) {
  const bySquash = new Map();
  for (const id of knownIds) bySquash.set(squash(id), id);
  const refTo = (set, prop) => {
    const [kind, s] = TOKEN_SETS[set] ?? ['sys', kebab(set)];
    return bySquash.get(squash(`md${kind}${s}${prop}`)) ?? derivedId(kind, s, kebab(prop));
  };
  const out = [];
  for (const f of await listFiles(dir, n => n.endsWith('.dart'))) {
    const lines = (await readFile(f.abs, 'utf8')).split(/\r?\n/);
    const cls = lines.map(l => /^class\s+(\w+)/.exec(l)).find(Boolean)?.[1] ?? f.rel;
    let doc = null;
    for (let i = 0; i < lines.length; i++) {
      const d = /^\s*\/\/\/\s+(md\.[a-z0-9.-]+)\s*$/.exec(lines[i]);
      if (d) { doc = d[1]; continue; }
      const decl = /^\s*static const (\w+) (\w+)\s*=\s*(.*)$/.exec(lines[i]);
      if (!decl || !doc) { if (lines[i].trim() && !/^\s*\/\//.test(lines[i])) doc = null; continue; }
      const [, , name] = decl;
      let expr = decl[3];
      let j = i;
      while (!/;\s*$/.test(expr) && j + 1 < lines.length) expr += ` ${lines[++j].trim()}`;
      expr = expr.replace(/;\s*$/, '').trim();
      const id = doc;
      const base = { source: 'material_ui', file: f.rel, line: i + 1, kind: id.split('.')[1] };
      const mode = modeFor(f.rel, id);
      const push = (rid, value, raw, native) => out.push({ id: rid, native, ...base, ...(mode ? { mode } : {}), value, raw });
      let m;
      if ((m = /^TypescaleStruct\(([\s\S]*)\)$/.exec(expr))) {
        const fl = fields(m[1]);
        for (const [field, sub] of Object.entries(TYPESCALE_FIELDS)) {
          if (!(field in fl)) continue;
          const v = fl[field].startsWith("'") ? { string: str(fl[field]) } : { number: num(fl[field]) };
          push(`${id}.${sub}`, v, fl[field], `${cls}.${name}.${field}`);
        }
      } else {
        let value;
        if ((m = /^Token(\w+)\.(\w+)$/.exec(expr))) value = { ref: refTo(m[1], m[2]) };
        else if ((m = /^ShapeStruct\(([\s\S]*)\)$/.exec(expr))) {
          const fl = fields(m[1]);
          value = { shape: { family: str(fl.family ?? "''"), corners: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map(k => num(fl[k])) } };
        } else if ((m = /^CubicStruct\(([\s\S]*)\)$/.exec(expr))) {
          const fl = fields(m[1]);
          value = ['a', 'b', 'c', 'd'].every(k => k in fl) ? { easing: ['a', 'b', 'c', 'd'].map(k => num(fl[k])) } : { unparsed: expr };
        } else if ((m = /^Duration\(milliseconds:\s*(\d+(?:\.\d+)?)\)$/.exec(expr))) value = { ms: num(m[1]) };
        else if ((m = /^'0x([0-9a-f]{2})([0-9a-f]{6})'$/i.exec(expr))) value = { hex: `#${m[2].toLowerCase()}${m[1].toLowerCase()}` };
        else if ((m = /^'([^']*)'$/.exec(expr))) value = { string: m[1] };
        else if (/^-?\d+(?:\.\d+)?$/.test(expr)) value = { number: num(expr) };
        else value = normalizeValue(expr, 'material_ui', name);
        push(id, value, expr, `${cls}.${name}`);
      }
      doc = null;
      i = j;
    }
  }
  return out;
}

// material-web tokens (tokens/versions/latest/sass): `/// md.<id> (...)` doc comment + `$var: value;`.
import { readFile } from 'node:fs/promises';
import { normalizeValue, derivedId, listFiles } from './model.mjs';

const FILE = /^_md-(ref|sys|comp)-(.+)\.scss$/;
const SPRING = /^md\.sys\.motion\.spring\./;

function modeFor(kind, set, mods) {
  if (kind !== 'sys' || set !== 'color') return undefined;
  const dark = mods.includes('dark');
  const contrast = mods.find(m => /contrast$/.test(m));
  return `${dark ? 'dark' : 'light'}${contrast ? `-${contrast}` : ''}`;
}

export async function extractWeb(dir) {
  const files = await listFiles(dir, n => FILE.test(n));
  const parsed = [];
  const varIds = new Map(); // "md-sys-color.$primary" -> id
  for (const f of files) {
    const [, kind, rest] = FILE.exec(f.rel.split('/').pop());
    const [set, ...mods] = rest.split('__');
    const lines = (await readFile(f.abs, 'utf8')).split(/\r?\n/);
    let doc = null;
    lines.forEach((line, i) => {
      const d = /^\/\/\/\s+(md\.[a-z0-9.-]+)(.*)$/.exec(line);
      if (d) {
        doc = { id: d[1], deprecated: /\[Deprecated\]/.test(d[2]) };
        return;
      }
      // Doc blocks continue over further `///` lines (blank, description, @deprecated ...).
      if (doc && /^\/\/\//.test(line)) {
        if (/@deprecated\b/.test(line)) doc.deprecated = true;
        return;
      }
      const v = /^\$([a-z0-9-]+)\s*:\s*(.+?);?\s*$/.exec(line);
      if (v) {
        const id = doc?.id ?? derivedId(kind, set, v[1]);
        parsed.push({ kind, set, mods, file: f.rel, line: i + 1, name: v[1], raw: v[2].replace(/;\s*$/, ''), id, derived: !doc, deprecated: doc?.deprecated });
        if (!mods.length && !varIds.has(`md-${kind}-${set}.$${v[1]}`)) varIds.set(`md-${kind}-${set}.$${v[1]}`, id);
      }
      doc = null;
    });
  }
  return parsed.map(p => {
    let value;
    let m;
    if ((m = /^(md-(?:ref|sys|comp)-[a-z0-9-]+)\.\$([a-z0-9-]+)$/.exec(p.raw))) {
      const [, mod, name] = m;
      const [, k, s] = /^md-(ref|sys|comp)-(.+)$/.exec(mod);
      value = { ref: varIds.get(`${mod}.$${name}`) ?? derivedId(k, s, name) };
    } else if ((m = /^\$([a-z0-9-]+)$/.exec(p.raw))) {
      value = { ref: varIds.get(`md-${p.kind}-${p.set}.$${m[1]}`) ?? derivedId(p.kind, p.set, m[1]) };
    } else {
      value = normalizeValue(p.raw, 'material-web', p.name);
    }
    const mode = SPRING.test(p.id) ? 'standard' : modeFor(p.kind, p.set, p.mods);
    return {
      id: p.id, native: `$${p.name}`, source: 'material-web', file: p.file, line: p.line, kind: p.kind,
      ...(mode ? { mode } : {}), value, raw: p.raw, ...(p.derived ? { derived: true } : {}), ...(p.deprecated ? { deprecated: true } : {}),
    };
  });
}

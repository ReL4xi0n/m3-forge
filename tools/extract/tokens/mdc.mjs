// MDC-Android token resources (cross-check only): <dimen|color|item|integer name="m3_...">value</...>
// in unqualified res/values/ directories. Names are matched to known token-database ids by
// separator-insensitive comparison; no match -> id null (listed as unmapped).
import { readFile } from 'node:fs/promises';
import { normalizeValue, squash, listFiles } from './model.mjs';

const ENTRY = /<(dimen|color|integer|item|string|bool|fraction)\s+name="(m3_(ref|sys|comp)_[a-z0-9_]+)"[^>]*>([^<]*)<\//;

function knownBySquash(knownIds) {
  const m = new Map();
  for (const id of knownIds) {
    const k = squash(id);
    m.set(k, m.has(k) && m.get(k) !== id ? null : id);
  }
  return m;
}

export async function extractMdc(dir, { knownIds = new Set() } = {}) {
  const bySquash = knownBySquash(knownIds);
  const idFor = name => bySquash.get(squash(`md${name.slice(3)}`)) || null;
  const files = (await listFiles(dir, n => /tokens\.xml$/i.test(n))).filter(f => /(^|\/)res\/values\//.test(f.rel));
  const out = [];
  for (const f of files) {
    const lines = (await readFile(f.abs, 'utf8')).split(/\r?\n/);
    lines.forEach((line, i) => {
      const m = ENTRY.exec(line);
      if (!m) return;
      const [, , name, kind, rawText] = m;
      const raw = rawText.trim();
      let value;
      let r;
      if ((r = /^@(?:dimen|color|integer)\/(m3_[a-z0-9_]+)$/.exec(raw))) {
        const target = idFor(r[1]);
        value = target ? { ref: target } : { unparsed: raw };
      } else if ((r = /^#([0-9a-f]{2})([0-9a-f]{6})$/i.exec(raw))) {
        value = { hex: `#${r[2].toLowerCase()}${r[1].toLowerCase()}` }; // Android #AARRGGBB
      } else {
        value = normalizeValue(raw, 'material-components-android', name);
      }
      out.push({ id: idFor(name), native: name, source: 'material-components-android', file: f.rel, line: i + 1, kind, value, raw });
    });
  }
  return out;
}

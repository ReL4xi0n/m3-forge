// Blind judging (spec §12): copy each output's screenshots into a judge folder under random opaque IDs.
// PNGs keep only IHDR, PLTE, IDAT and IEND (no text, time or EXIF chunks); mtimes are one fixed date;
// the ID → (cell, condition, repeat, run) mapping is written outside the judge folder.
import { mkdirSync, readFileSync, writeFileSync, utimesSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';

const KEEP = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND']);
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const FIXED_TIME = new Date('2000-01-01T00:00:00Z');
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function* chunks(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  for (let o = 8; o < buf.length;) {
    const len = buf.readUInt32BE(o);
    const type = buf.toString('latin1', o + 4, o + 8);
    yield { type, bytes: buf.subarray(o, o + 12 + len) };
    o += 12 + len;
  }
}

export const pngChunks = buf => [...chunks(buf)].map(c => c.type);

export function stripPng(buf) {
  return Buffer.concat([SIG, ...[...chunks(buf)].filter(c => KEEP.has(c.type)).map(c => c.bytes)]);
}

export function newIds(n, taken = new Set()) {
  const out = [];
  while (out.length < n) {
    const b = randomBytes(6);
    const id = [...b].map(x => ALPHABET[x % ALPHABET.length]).join('');
    if (taken.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

function shuffle(a) {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) { const j = randomBytes(4).readUInt32BE() % (i + 1); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
}

// outputs: [{ cell, condition, repeat, runId, request, shots: [{ file, theme, viewport }] }]
// The judge folder gets <id>_<k>.png, views.json (id → [{file, theme, viewport}]) and requests.json (id → text).
export function anonymize({ outputs, judgeDir, mappingPath }) {
  if (existsSync(judgeDir)) rmSync(judgeDir, { recursive: true });
  mkdirSync(judgeDir, { recursive: true });
  const ids = newIds(outputs.length);
  const order = shuffle(outputs.map((o, i) => i));
  const mapping = {};
  const views = {};
  const requests = {};
  order.forEach((idx, n) => {
    const o = outputs[idx];
    const id = ids[n];
    mapping[id] = { cell: o.cell, condition: o.condition, repeat: o.repeat, runId: o.runId };
    requests[id] = o.request;
    views[id] = shuffle(o.shots).map((s, k) => {
      const file = `${id}_${k + 1}.png`;
      const dest = join(judgeDir, file);
      writeFileSync(dest, stripPng(readFileSync(s.file)));
      utimesSync(dest, FIXED_TIME, FIXED_TIME);
      return { file, theme: s.theme, viewport: s.viewport };
    });
  });
  const sorted = obj => Object.fromEntries(Object.keys(obj).sort().map(k => [k, obj[k]]));
  writeFileSync(join(judgeDir, 'views.json'), JSON.stringify(sorted(views), null, 2));
  writeFileSync(join(judgeDir, 'requests.json'), JSON.stringify(sorted(requests), null, 2));
  for (const f of ['views.json', 'requests.json']) utimesSync(join(judgeDir, f), FIXED_TIME, FIXED_TIME);
  mkdirSync(dirname(mappingPath), { recursive: true });
  writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  return { ids: Object.keys(mapping), views, mappingPath };
}

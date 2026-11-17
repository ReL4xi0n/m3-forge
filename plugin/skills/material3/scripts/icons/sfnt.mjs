// Minimal sfnt reading and writing for the icon subsetter: table directory, cmap lookup, and a GSUB
// rewrite that keeps only the ligatures a project asked for.
//
// Why the rewrite: hb-subset keeps every ligature whose letters are all kept. With the letters of
// twenty icon names that is over a thousand glyphs, so the font would hold icons nobody asked for.
// Material Symbols stores its ligatures in lookup 0 of GSUB as extension subtables that wrap
// LigatureSubstFormat1; pruning that lookup before subsetting makes the closure follow only the
// requested names. Anything with a different layout throws, and the caller falls back to the full font.

export function readSfnt(buf) {
  const n = buf.readUInt16BE(4);
  const tables = [];
  for (let i = 0; i < n; i++) {
    const o = 12 + i * 16;
    const off = buf.readUInt32BE(o + 8);
    const len = buf.readUInt32BE(o + 12);
    tables.push({ tag: buf.toString('latin1', o, o + 4), data: buf.subarray(off, off + len) });
  }
  return { flavor: buf.readUInt32BE(0), tables };
}

function checksum(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const w = Buffer.alloc(4);
    data.copy(w, 0, i, Math.min(i + 4, data.length));
    sum = (sum + w.readUInt32BE(0)) >>> 0;
  }
  return sum;
}

export function writeSfnt({ flavor, tables }) {
  const sorted = [...tables].sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const n = sorted.length;
  let pow = 1;
  let log = 0;
  while (pow * 2 <= n) { pow *= 2; log++; }
  const head = Buffer.alloc(12 + 16 * n);
  head.writeUInt32BE(flavor, 0);
  head.writeUInt16BE(n, 4);
  head.writeUInt16BE(pow * 16, 6);
  head.writeUInt16BE(log, 8);
  head.writeUInt16BE(n * 16 - pow * 16, 10);
  let off = head.length;
  const parts = [head];
  sorted.forEach((t, i) => {
    const o = 12 + i * 16;
    head.write(t.tag, o, 'latin1');
    head.writeUInt32BE(checksum(t.data), o + 4);
    head.writeUInt32BE(off, o + 8);
    head.writeUInt32BE(t.data.length, o + 12);
    const pad = (4 - (t.data.length % 4)) % 4;
    parts.push(t.data, Buffer.alloc(pad));
    off += t.data.length + pad;
  });
  return Buffer.concat(parts);
}

// code point -> glyph id, from the Unicode cmap (format 12 preferred, format 4 otherwise).
export function readCmap(cmap) {
  const n = cmap.readUInt16BE(2);
  let best = null;
  for (let i = 0; i < n; i++) {
    const platform = cmap.readUInt16BE(4 + 8 * i);
    const encoding = cmap.readUInt16BE(6 + 8 * i);
    const off = cmap.readUInt32BE(8 + 8 * i);
    const format = cmap.readUInt16BE(off);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (unicode && (format === 12 || (format === 4 && !best))) best = { off, format };
    if (best?.format === 12) break;
  }
  if (!best) throw new Error('sfnt: no Unicode cmap');
  const map = new Map();
  const { off } = best;
  if (best.format === 12) {
    const groups = cmap.readUInt32BE(off + 12);
    for (let g = 0; g < groups; g++) {
      const o = off + 16 + 12 * g;
      const start = cmap.readUInt32BE(o);
      const end = cmap.readUInt32BE(o + 4);
      const gid = cmap.readUInt32BE(o + 8);
      for (let c = start; c <= end; c++) map.set(c, gid + c - start);
    }
  } else {
    const segs = cmap.readUInt16BE(off + 6) / 2;
    const endO = off + 14;
    const startO = endO + segs * 2 + 2;
    const deltaO = startO + segs * 2;
    const rangeO = deltaO + segs * 2;
    for (let s = 0; s < segs; s++) {
      const end = cmap.readUInt16BE(endO + 2 * s);
      const start = cmap.readUInt16BE(startO + 2 * s);
      const delta = cmap.readInt16BE(deltaO + 2 * s);
      const range = cmap.readUInt16BE(rangeO + 2 * s);
      for (let c = start; c <= end && c < 0xffff; c++) {
        let gid;
        if (range === 0) gid = (c + delta) & 0xffff;
        else {
          const p = rangeO + 2 * s + range + 2 * (c - start);
          gid = cmap.readUInt16BE(p);
          if (gid) gid = (gid + delta) & 0xffff;
        }
        if (gid) map.set(c, gid);
      }
    }
  }
  return map;
}

// Parses the ligatures of GSUB lookup 0: [{ first, rest: number[], glyph }].
function readLigatures(gsub) {
  const lookupList = gsub.readUInt16BE(8);
  const lookup0 = lookupList + gsub.readUInt16BE(lookupList + 2);
  const type = gsub.readUInt16BE(lookup0);
  const count = gsub.readUInt16BE(lookup0 + 4);
  const out = [];
  for (let s = 0; s < count; s++) {
    let sub = lookup0 + gsub.readUInt16BE(lookup0 + 6 + 2 * s);
    if (type === 7) {
      if (gsub.readUInt16BE(sub + 2) !== 4) throw new Error('GSUB: unexpected extension type');
      sub += gsub.readUInt32BE(sub + 4);
    } else if (type !== 4) throw new Error('GSUB: lookup 0 is not a ligature lookup');
    if (gsub.readUInt16BE(sub) !== 1) throw new Error('GSUB: unexpected ligature format');
    const cov = sub + gsub.readUInt16BE(sub + 2);
    const covGlyphs = [];
    if (gsub.readUInt16BE(cov) === 1) {
      const c = gsub.readUInt16BE(cov + 2);
      for (let i = 0; i < c; i++) covGlyphs.push(gsub.readUInt16BE(cov + 4 + 2 * i));
    } else {
      const c = gsub.readUInt16BE(cov + 2);
      for (let i = 0; i < c; i++) {
        const o = cov + 4 + 6 * i;
        for (let g = gsub.readUInt16BE(o); g <= gsub.readUInt16BE(o + 2); g++) covGlyphs.push(g);
      }
    }
    const setCount = gsub.readUInt16BE(sub + 4);
    for (let i = 0; i < setCount; i++) {
      const set = sub + gsub.readUInt16BE(sub + 6 + 2 * i);
      const n = gsub.readUInt16BE(set);
      for (let j = 0; j < n; j++) {
        const lig = set + gsub.readUInt16BE(set + 2 + 2 * j);
        const comps = gsub.readUInt16BE(lig + 2);
        const rest = [];
        for (let k = 0; k < comps - 1; k++) rest.push(gsub.readUInt16BE(lig + 4 + 2 * k));
        out.push({ first: covGlyphs[i], rest, glyph: gsub.readUInt16BE(lig) });
      }
    }
  }
  return { ligatures: out, lookup0, lookupList };
}

// Replaces the ligatures of lookup 0 with `keep`. The new ligature subtable is appended to the table,
// the first extension subtable of the lookup is pointed at it and the lookup is told it has one
// subtable; the old data stays in the file as unreferenced bytes, so no other offset moves (the
// lookup list, FeatureVariations and the other lookups keep their place). hb-subset drops the dead
// bytes when it rewrites the table.
function writeGsub(gsub, lookupList, lookup0, keep) {
  const type = gsub.readUInt16BE(lookup0);
  const flag = gsub.readUInt16BE(lookup0 + 2);
  if (type !== 7 || flag & 0x10) throw new Error('GSUB: lookup 0 layout not supported');
  // Ligature subtable: coverage + ligature sets, sorted by first glyph.
  const byFirst = new Map();
  for (const l of keep) (byFirst.get(l.first) ?? byFirst.set(l.first, []).get(l.first)).push(l);
  const firsts = [...byFirst.keys()].sort((a, b) => a - b);
  const sets = firsts.map((f) => {
    // Longer ligatures first, as the format asks for.
    const ligs = byFirst.get(f).sort((a, b) => b.rest.length - a.rest.length);
    const bodies = ligs.map((l) => {
      const b = Buffer.alloc(4 + 2 * l.rest.length);
      b.writeUInt16BE(l.glyph, 0);
      b.writeUInt16BE(l.rest.length + 1, 2);
      l.rest.forEach((g, i) => b.writeUInt16BE(g, 4 + 2 * i));
      return b;
    });
    const head = Buffer.alloc(2 + 2 * bodies.length);
    head.writeUInt16BE(bodies.length, 0);
    let off = head.length;
    bodies.forEach((b, i) => { head.writeUInt16BE(off, 2 + 2 * i); off += b.length; });
    return Buffer.concat([head, ...bodies]);
  });
  const coverage = Buffer.alloc(4 + 2 * firsts.length);
  coverage.writeUInt16BE(1, 0);
  coverage.writeUInt16BE(firsts.length, 2);
  firsts.forEach((g, i) => coverage.writeUInt16BE(g, 4 + 2 * i));
  const subHead = Buffer.alloc(6 + 2 * sets.length);
  subHead.writeUInt16BE(1, 0);
  subHead.writeUInt16BE(subHead.length, 2);
  subHead.writeUInt16BE(sets.length, 4);
  let off = subHead.length + coverage.length;
  sets.forEach((s, i) => { subHead.writeUInt16BE(off, 6 + 2 * i); off += s.length; });
  const ligSubtable = Buffer.concat([subHead, coverage, ...sets]);
  const out = Buffer.from(gsub);
  const pad = (4 - (out.length % 4)) % 4;
  const pos = out.length + pad;
  const ext = lookup0 + out.readUInt16BE(lookup0 + 6);
  out.writeUInt16BE(1, lookup0 + 4);
  out.writeUInt32BE(pos - ext, ext + 4);
  return Buffer.concat([out, Buffer.alloc(pad), ligSubtable]);
}

// pruneLigatures(ttf, names, letterOf) -> Buffer: the font with only the ligatures that spell `names`.
export function pruneLigatures(ttf, names) {
  const sfnt = readSfnt(ttf);
  const table = (tag) => sfnt.tables.find((t) => t.tag === tag);
  const cmap = readCmap(table('cmap').data);
  const gsub = table('GSUB').data;
  const { ligatures, lookup0, lookupList } = readLigatures(gsub);
  const keep = [];
  for (const name of names) {
    const ids = [...name].map((c) => cmap.get(c.codePointAt(0)));
    if (ids.some((g) => g === undefined)) continue;
    const hit = ligatures.find((l) => l.first === ids[0] && l.rest.length === ids.length - 1 && l.rest.every((g, i) => g === ids[i + 1]));
    if (hit && !keep.includes(hit)) keep.push(hit);
  }
  const next = writeGsub(gsub, lookupList, lookup0, keep);
  return writeSfnt({ flavor: sfnt.flavor, tables: sfnt.tables.map((t) => (t.tag === 'GSUB' ? { tag: 'GSUB', data: next } : t)) });
}

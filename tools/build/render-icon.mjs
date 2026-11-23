#!/usr/bin/env node
// Renders docs/images/icon.svg to docs/images/icon.png (512 x 512) with node only: the icon is made
// of one rounded square, polygons and circles, drawn here with 4x4 supersampling.
//   node tools/build/render-icon.mjs [--check]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const SVG = REPO + 'docs/images/icon.svg';
const PNG = REPO + 'docs/images/icon.png';
const SIZE = 512;
const SS = 4;

const attr = (tag, name) => { const m = tag.match(new RegExp(String.raw`\s${name}="([^"]*)"`)); return m ? m[1] : null; };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

export function parseShapes(svg) {
  const shapes = [];
  for (const m of svg.matchAll(/<(rect|polygon|circle)\b[^>]*>/g)) {
    const tag = m[0];
    const fill = hex(attr(tag, 'fill'));
    if (m[1] === 'rect') {
      shapes.push({ kind: 'rect', x: +(attr(tag, 'x') || 0), y: +(attr(tag, 'y') || 0), w: +attr(tag, 'width'), h: +attr(tag, 'height'), rx: +(attr(tag, 'rx') || 0), fill });
    } else if (m[1] === 'circle') {
      shapes.push({ kind: 'circle', cx: +attr(tag, 'cx'), cy: +attr(tag, 'cy'), r: +attr(tag, 'r'), fill });
    } else {
      const pts = attr(tag, 'points').trim().split(/\s+/).map(p => p.split(',').map(Number));
      shapes.push({ kind: 'poly', pts, fill });
    }
  }
  return shapes;
}

function inside(s, x, y) {
  if (s.kind === 'circle') return (x - s.cx) ** 2 + (y - s.cy) ** 2 <= s.r ** 2;
  if (s.kind === 'rect') {
    if (x < s.x || y < s.y || x > s.x + s.w || y > s.y + s.h) return false;
    const cx = Math.min(Math.max(x, s.x + s.rx), s.x + s.w - s.rx);
    const cy = Math.min(Math.max(y, s.y + s.rx), s.y + s.h - s.rx);
    return (x - cx) ** 2 + (y - cy) ** 2 <= s.rx ** 2 || (cx === x && cy === y) || s.rx === 0;
  }
  let c = false;
  const p = s.pts;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
}

export function render(svg = readFileSync(SVG, 'utf8')) {
  const shapes = parseShapes(svg);
  const scale = 256 / SIZE; // the SVG viewBox is 256 units
  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
  for (let py = 0; py < SIZE; py++) {
    raw[py * (SIZE * 4 + 1)] = 0;
    for (let px = 0; px < SIZE; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const x = (px + (sx + 0.5) / SS) * scale, y = (py + (sy + 0.5) / SS) * scale;
        let hit = null;
        for (const s of shapes) if (inside(s, x, y)) hit = s;
        if (hit) { r += hit.fill[0]; g += hit.fill[1]; b += hit.fill[2]; a++; }
      }
      const o = py * (SIZE * 4 + 1) + 1 + px * 4;
      if (a) { raw[o] = Math.round(r / a); raw[o + 1] = Math.round(g / a); raw[o + 2] = Math.round(b / a); raw[o + 3] = Math.round((a / (SS * SS)) * 255); }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const png = render();
  if (process.argv.includes('--check')) {
    if (!existsSync(PNG) || !readFileSync(PNG).equals(png)) { console.error('docs/images/icon.png is out of date: run node tools/build/render-icon.mjs'); process.exit(1); }
    console.log('icon.png is up to date');
  } else {
    writeFileSync(PNG, png);
    console.log(`wrote ${PNG} (${png.length} bytes)`);
  }
}

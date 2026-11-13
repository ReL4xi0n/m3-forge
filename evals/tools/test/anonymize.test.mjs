import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { deflateSync, crc32 } from 'node:zlib';
import { anonymize, pngChunks, newIds } from '../anonymize.mjs';

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}
// A 1x1 RGB PNG carrying text, time and EXIF chunks that name its source.
function leakyPng(label) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('tEXt', Buffer.from(`Comment\0${label} baseline skill run-42`, 'latin1')),
    chunk('tIME', Buffer.from([7, 234, 11, 13, 12, 0, 0])),
    chunk('eXIf', Buffer.from(`MM\0*${label}`, 'latin1')),
    chunk('iTXt', Buffer.from(`Source\0\0\0\0\0${label}`, 'latin1')),
    chunk('IDAT', deflateSync(Buffer.from([0, 255, 0, 0]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function outputs(n) {
  const base = mkdtempSync(join(tmpdir(), 'm3anon-'));
  const list = [];
  for (let i = 0; i < n; i++) {
    const cell = `settings.web.web-react.default`;
    const dir = join(base, 'run-42', `${cell}-${i}`);
    mkdirSync(dir, { recursive: true });
    const shots = [];
    for (const [theme, viewport] of [['light', '412x915'], ['dark', '412x915']]) {
      const f = join(dir, `${theme}-${viewport}.png`);
      writeFileSync(f, leakyPng(`${cell}-${i}`));
      shots.push({ file: f, theme, viewport });
    }
    list.push({ cell, condition: i % 2 ? 'skill' : 'baseline', repeat: 1, runId: 'run-42', request: 'Build a settings screen.\n\nUse Material Design 3.', shots });
  }
  return { base, list };
}

test('pngChunks: lists chunk types', () => {
  assert.deepEqual(pngChunks(leakyPng('x')), ['IHDR', 'tEXt', 'tIME', 'eXIf', 'iTXt', 'IDAT', 'IEND']);
});

test('anonymize: only IHDR/PLTE/IDAT/IEND survive; no source string anywhere in the judge folder', () => {
  const { base, list } = outputs(4);
  const judgeDir = join(base, 'judge');
  const mappingPath = join(base, 'private', 'mapping.json');
  const r = anonymize({ outputs: list, judgeDir, mappingPath, seed: 7 });
  const files = readdirSync(judgeDir);
  for (const f of files.filter(f => f.endsWith('.png'))) {
    const buf = readFileSync(join(judgeDir, f));
    assert.ok(pngChunks(buf).every(t => ['IHDR', 'PLTE', 'IDAT', 'IEND'].includes(t)), f);
    assert.match(f, /^[a-z0-9]{6}_\d\.png$/);
    assert.equal(statSync(join(judgeDir, f)).mtime.getUTCFullYear(), 2000);
  }
  for (const f of files) {
    const text = readFileSync(join(judgeDir, f)).toString('latin1').toLowerCase();
    for (const bad of ['skill', 'baseline', 'run-42', 'web-react', 'settings.web']) assert.ok(!text.includes(bad), `${f} contains ${bad}`);
  }
  assert.ok(!existsSync(join(judgeDir, 'mapping.json')));
  const mapping = JSON.parse(readFileSync(mappingPath, 'utf8'));
  assert.equal(Object.keys(mapping).length, 4);
  for (const [id, m] of Object.entries(mapping)) {
    assert.equal(r.views[id].length, 2);
    assert.ok(['skill', 'baseline'].includes(m.condition));
  }
  const views = JSON.parse(readFileSync(join(judgeDir, 'views.json'), 'utf8'));
  assert.deepEqual(Object.keys(views).sort(), Object.keys(mapping).sort());
  const requests = JSON.parse(readFileSync(join(judgeDir, 'requests.json'), 'utf8'));
  assert.match(requests[Object.keys(mapping)[0]], /settings screen/);
});

test('newIds: 1,000 unique 6-character ids', () => {
  const ids = newIds(1000);
  assert.equal(new Set(ids).size, 1000);
  assert.ok(ids.every(i => /^[a-z0-9]{6}$/.test(i)));
});

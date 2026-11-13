import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';


const VERIFY = fileURLToPath(new URL('../', import.meta.url));

test('shape-scale.json holds the M3 corner scale with its source token ids', async () => {
  const s = JSON.parse(await readFile(join(VERIFY, 'shape-scale.json'), 'utf8'));
  assert.match(s._comment, /md\.sys\.shape\.corner/);
  assert.deepEqual(s.scale, [0, 4, 8, 12, 16, 20, 28, 32, 48, 9999]);
  for (const v of s.scale) assert.ok(Object.values(s.sources).includes(v));
  assert.ok(Object.keys(s.sources).every(k => k.startsWith('md.sys.shape.corner.')));
});

test('runtime modules never read knowledge/', async () => {
  for (const f of await readdir(VERIFY)) {
    if (!f.endsWith('.mjs')) continue;
    const text = await readFile(join(VERIFY, f), 'utf8');
    assert.ok(!/knowledge/.test(text), `${f} must not reference knowledge/`);
  }
});

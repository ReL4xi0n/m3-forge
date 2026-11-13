// Shared helpers for the verify tests. Not a test file itself (no .test.mjs suffix).
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

import { verify } from '../index.mjs';

export const SAMPLES = fileURLToPath(new URL('./samples/', import.meta.url));

export const STATIC_CHECKS = [
  'hardcoded-color',
  'off-token-type',
  'off-token-radius',
  'off-grid-spacing',
  'shadow-gradient',
  'icon-source',
];

export function sample(platform, name) {
  return join(SAMPLES, platform, name);
}

export function run(platform, name, runtime) {
  return verify({ projectDir: sample(platform, name), platform, runtime });
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

// Every planted violation sits on a line whose comment contains the marker HIT.
// Comments are stripped before scanning, so the marker never causes a hit itself.
export async function markerLines(dir) {
  const set = new Set();
  for (const file of await walk(dir)) {
    const rel = relative(dir, file).split(sep).join('/');
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
    lines.forEach((l, i) => {
      if (/\bHIT\b/.test(l)) set.add(`${rel}:${i + 1}`);
    });
  }
  return set;
}

export function nonZero(counts) {
  return Object.fromEntries(Object.entries(counts).filter(([, n]) => n !== 0));
}

// One hit sample and one clean sample per check.
export function checkSuite(platform, checks) {
  for (const check of checks) {
    test(`${platform} ${check}: hit sample reports every planted line, and only that check`, async () => {
      const dir = sample(platform, `${check}-hit`);
      const r = await run(platform, `${check}-hit`);
      const expected = await markerLines(dir);
      assert.ok(expected.size > 0, 'sample has planted markers');
      assert.deepEqual(nonZero(r.counts), { [check]: expected.size });
      const got = new Set(r.violations.map(v => `${v.file}:${v.line}`));
      assert.deepEqual([...got].sort(), [...expected].sort());
      for (const v of r.violations) {
        assert.equal(v.check, check);
        assert.equal(v.severity, check === 'off-grid-spacing' ? 'warning' : 'error');
        assert.equal(typeof v.detail, 'string');
        assert.ok(v.detail.length > 0);
      }
      assert.equal(r.exitCode, check === 'off-grid-spacing' ? 0 : 1);
      assert.ok(r.uiLines > 0);
    });

    test(`${platform} ${check}: clean sample has no violations`, async () => {
      const r = await run(platform, `${check}-clean`);
      assert.deepEqual(r.violations, []);
      assert.deepEqual(nonZero(r.counts), {});
      assert.equal(r.exitCode, 0);
      assert.ok(r.uiLines > 0);
    });
  }
}

export function countNonBlank(text) {
  return text.split(/\r?\n/).filter(l => l.trim() !== '').length;
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findExamples } from '../verify-examples.mjs';

const script = fileURLToPath(new URL('../verify-examples.mjs', import.meta.url));
const tmp = () => mkdtempSync(join(tmpdir(), 'm3-examples-'));

test('findExamples lists <platform>/<name> folders and reports unknown top folders', () => {
  const root = tmp();
  try {
    mkdirSync(join(root, 'web', 'a'), { recursive: true });
    mkdirSync(join(root, 'compose', 'b'), { recursive: true });
    mkdirSync(join(root, 'misc'), { recursive: true });
    const { found, unknown } = findExamples(root);
    assert.deepEqual(found.map(f => `${f.platform}/${f.name}`).sort(), ['compose/b', 'web/a']);
    assert.deepEqual(unknown, ['misc']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('an empty or missing examples folder is skipped with exit 0', () => {
  const root = tmp();
  try {
    for (const dir of [root, join(root, 'nope')]) {
      const r = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
      assert.equal(r.status, 0);
      assert.match(r.stdout, /skipped/);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a folder that is not a platform fails with exit 2', () => {
  const root = tmp();
  try {
    mkdirSync(join(root, 'misc', 'x'), { recursive: true });
    assert.equal(spawnSync(process.execPath, [script, root], { encoding: 'utf8' }).status, 2);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

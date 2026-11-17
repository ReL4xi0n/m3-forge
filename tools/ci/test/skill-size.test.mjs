import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { skillSize, MAX_BYTES } from '../skill-size.mjs';

test('skillSize counts bytes and files recursively, path with spaces', () => {
  const d = mkdtempSync(join(tmpdir(), 'skill size '));
  try {
    mkdirSync(join(d, 'a b'));
    writeFileSync(join(d, 'x.txt'), '12345');
    writeFileSync(join(d, 'a b', 'y.txt'), '123');
    assert.deepEqual(skillSize(d), { bytes: 8, files: 2 });
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('the skill is at most 25 MB', () => {
  const dir = fileURLToPath(new URL('../../../plugin/skills/material3', import.meta.url));
  const { bytes } = skillSize(dir);
  assert.ok(bytes <= MAX_BYTES && MAX_BYTES === 25 * 1024 * 1024, `${bytes}`);
});

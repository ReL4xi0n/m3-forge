import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashes } from '../freeze-harness.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Flutter harness v3 is frozen: a change needs a new version and a re-capture of the baseline.
test('harness/flutter files match evals/frozen-harness.json', () => {
  const frozen = JSON.parse(readFileSync(join(root, 'evals', 'frozen-harness.json'), 'utf8'));
  assert.equal(frozen.flutterHarness, 'v3');
  assert.deepEqual(hashes(root), frozen.files);
});

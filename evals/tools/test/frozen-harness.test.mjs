import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashes } from '../freeze-harness.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Flutter and Compose harness v3 are frozen: a change needs a new version and a re-capture of the baseline,
// except a recorded amendment that can only remove findings (amendments[] in evals/frozen-harness.json).
test('harness/flutter and harness/compose files match evals/frozen-harness.json', () => {
  const frozen = JSON.parse(readFileSync(join(root, 'evals', 'frozen-harness.json'), 'utf8'));
  assert.equal(frozen.flutterHarness, 'v3');
  assert.equal(frozen.composeHarness, 'v3');
  assert.deepEqual(hashes(root), frozen.files);
});

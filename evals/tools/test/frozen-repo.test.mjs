import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkFrozen } from '../frozen.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Rubric v1 and the judge prompt are frozen (spec §12). A change needs rubric-v2.md and a re-score.
test('evals/rubric.md and evals/judge.md match evals/frozen.json', () => {
  const r = checkFrozen(root);
  assert.equal(r.ok, true, r.problems.join('; '));
});

// Rubric v2, judge v2 and automated items v2 (protocol change PC-2) are frozen after their own calibration.
test('evals/rubric-v2.md, judge-v2.md and automated-v2.md match evals/frozen-v2.json', () => {
  const r = checkFrozen(root, 'v2');
  assert.equal(r.ok, true, r.problems.join('; '));
  assert.equal(r.frozen.calibrationRounds.at(-1).result, 'PASS');
});

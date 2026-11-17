import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareAutomated, renderComparison } from '../rescore-automated.mjs';

const rows = [
  { cell: 'a.flutter', platform: 'flutter', v1: { 'token-fidelity': 2, 'contrast-targets': 3, 'anti-patterns': 0 }, v2: { 'token-fidelity': 2, 'contrast-targets': 1, 'anti-patterns': 3, 'icon-source': 0 }, targetsV1: 0, targetsV2: 4 },
  { cell: 'b.web', platform: 'web', v1: { 'token-fidelity': 1, 'contrast-targets': 1, 'anti-patterns': 1 }, v2: { 'token-fidelity': 1, 'contrast-targets': 1, 'anti-patterns': 1, 'icon-source': 3 }, targetsV1: 3, targetsV2: 3 },
];

test('compareAutomated: v1 and v2 means per platform and overall', () => {
  const c = compareAutomated(rows);
  assert.deepEqual(c.v2Items, ['token-fidelity', 'contrast-targets', 'anti-patterns', 'icon-source']);
  assert.equal(c.byPlatform.flutter.v1['anti-patterns'], 0);
  assert.equal(c.byPlatform.flutter.v2['anti-patterns'], 3);
  assert.equal(c.overall.v2['icon-source'], 1.5);
  assert.equal(c.overall.v1['icon-source'], undefined, 'v1 has no icon-source item');
});

test('renderComparison: a v1 column with no such item shows a dash', () => {
  const md = renderComparison('r', rows);
  assert.match(md, /\| icon-source \| — \| 0\.00 \|/);
  assert.match(md, /\| a\.flutter \|.*\| 0 \| 4 \|$/m);
});

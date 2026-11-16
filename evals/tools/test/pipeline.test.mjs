import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { automatedScores, judgeRequest } from '../pipeline.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const v = (counts, uiLines = 200) => ({ counts, uiLines });

test('automatedScores: rubric bands for token fidelity, contrast/targets and anti-patterns', () => {
  assert.deepEqual(automatedScores(v({}), true), { 'token-fidelity': 3, 'contrast-targets': 3, 'anti-patterns': 3 });
  // 2 token hits in 200 lines = 1 per 100 → 2; 3 per 100 → 1; 12 per 100 → 0
  assert.equal(automatedScores(v({ 'hardcoded-color': 2 }), true)['token-fidelity'], 2);
  assert.equal(automatedScores(v({ 'hardcoded-color': 4, 'off-token-type': 2 }), true)['token-fidelity'], 1);
  assert.equal(automatedScores(v({ 'off-token-radius': 24 }), true)['token-fidelity'], 0);
  assert.equal(automatedScores(v({ contrast: 1, 'touch-target': 1 }), true)['contrast-targets'], 2);
  assert.equal(automatedScores(v({ contrast: 6 }), true)['contrast-targets'], 1);
  assert.equal(automatedScores(v({ 'touch-target': 7 }), true)['contrast-targets'], 0);
  assert.equal(automatedScores(v({ 'icon-source': 1 }), true)['anti-patterns'], 2);
  assert.equal(automatedScores(v({ 'shadow-gradient': 2, 'foreign-styling': 2 }), true)['anti-patterns'], 1);
  assert.equal(automatedScores(v({ 'shadow-gradient': 5 }), true)['anti-patterns'], 0);
  assert.equal(automatedScores(v({ 'off-grid-spacing': 40 }), true)['token-fidelity'], 3, 'off-grid spacing is a warning only');
});

test('automatedScores: no buildable output scores 0 on every automated item', () => {
  assert.deepEqual(automatedScores(v({}), false), { 'token-fidelity': 0, 'contrast-targets': 0, 'anti-patterns': 0 });
  assert.deepEqual(automatedScores(null, true), { 'token-fidelity': 0, 'contrast-targets': 0, 'anti-patterns': 0 });
});

test('judgeRequest: the request, the style line and the platform, without the folder sentence', () => {
  const t = judgeRequest({ request: 'settings', platform: 'flutter', fixture: 'flutter-material_ui', variant: 'default' }, root);
  assert.match(t, /^# Settings screen/);
  assert.match(t, /M3 Expressive style/);
  assert.match(t, /Platform: Flutter\.$/);
  assert.doesNotMatch(t, /folder/);
});

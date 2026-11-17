import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { automatedScores, judgeRequest, schedule, isQuotaStop, canaryDue } from '../pipeline.mjs';

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

const C = (name, platform) => ({ cell: name, platform });

test('schedule: the first Compose cell runs alone first; web and Flutter cells run in pairs; other Compose cells run alone', () => {
  const cells = [C('w1', 'web'), C('f1', 'flutter'), C('c1', 'compose'), C('w2', 'web'), C('c2', 'compose'), C('f2', 'flutter'), C('w3', 'web')];
  const groups = schedule(cells, { pair: 2 }).map(g => g.map(c => c.cell));
  assert.deepEqual(groups[0], ['c1']);
  for (const g of groups) {
    if (g.some(n => n.startsWith('c'))) assert.equal(g.length, 1, `compose alone: ${g}`);
    else assert.ok(g.length <= 2, `${g}`);
  }
  assert.deepEqual(groups.flat().sort(), cells.map(c => c.cell).sort());
  assert.deepEqual(schedule(cells, { pair: 1 }).map(g => g.length), cells.map(() => 1));
});

test('canaryDue: before the first group, and again once 6 or more cells have run since the last canary', () => {
  assert.equal(canaryDue({ sinceCanary: null, next: 2 }), true);
  assert.equal(canaryDue({ sinceCanary: 4, next: 2 }), false);
  assert.equal(canaryDue({ sinceCanary: 5, next: 2 }), true);
  assert.equal(canaryDue({ sinceCanary: 6, next: 1 }), true);
});

test('isQuotaStop: a session that ends on a usage or rate limit stops the batch; other errors do not', () => {
  assert.equal(isQuotaStop({ status: 'session-error', resultText: "Claude AI usage limit reached|1794600000" }), true);
  assert.equal(isQuotaStop({ status: 'session-error', resultText: "You've hit your limit · resets 3am" }), true);
  assert.equal(isQuotaStop({ status: 'session-error', resultText: 'API Error: 429 rate_limit_error' }), true);
  assert.equal(isQuotaStop({ status: 'session-error', resultText: 'API Error: 500 overloaded' }), false);
  assert.equal(isQuotaStop({ status: 'ok', resultText: null }), false);
});

test('automatedScores v2: icon source is its own item and no longer part of anti-patterns', () => {
  const v2 = (counts, uiLines = 100) => ({ counts, uiLines });
  assert.deepEqual(automatedScores(v2({}), true, 'v2'), { 'token-fidelity': 3, 'contrast-targets': 3, 'anti-patterns': 3, 'icon-source': 3 });
  const legacyIcons = automatedScores(v2({ 'icon-source': 25 }), true, 'v2');
  assert.equal(legacyIcons['anti-patterns'], 3, 'Icons.* alone does not zero anti-patterns');
  assert.equal(legacyIcons['icon-source'], 0);
  assert.equal(automatedScores(v2({ 'icon-source': 1 }), true, 'v2')['icon-source'], 2);
  assert.equal(automatedScores(v2({ 'icon-source': 4 }), true, 'v2')['icon-source'], 1);
  assert.equal(automatedScores(v2({ 'shadow-gradient': 2, 'foreign-styling': 2 }), true, 'v2')['anti-patterns'], 1);
  assert.deepEqual(automatedScores(null, true, 'v2'), { 'token-fidelity': 0, 'contrast-targets': 0, 'anti-patterns': 0, 'icon-source': 0 });
  assert.deepEqual(automatedScores(v2({ 'icon-source': 25 }), true), automatedScores(v2({ 'icon-source': 25 }), true, 'v1'), 'v1 stays the default');
  assert.equal(automatedScores(v2({ 'icon-source': 25 }), true)['anti-patterns'], 0, 'v1 unchanged');
});

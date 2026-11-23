import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepDecision, regressionSample, seededPick, spotcheckSample, weakReasons } from '../phase4.mjs';

test('seededPick: deterministic and order-independent', () => {
  assert.equal(seededPick(['a', 'b', 'c'], 's'), seededPick(['c', 'a', 'b'], 's'));
  assert.equal(seededPick([], 's'), null);
});

test('spotcheckSample: per platform one default, the classic and the seed cell', () => {
  const s = spotcheckSample();
  for (const p of ['web', 'flutter', 'compose']) {
    assert.match(s[p].default, new RegExp(`\\.${p}\\..*\\.default$`));
    assert.match(s[p].classic, /\.classic$/);
    assert.match(s[p].seed, /\.seed-/);
  }
});

test('regressionSample: never a cell re-run in that round', () => {
  const r = regressionSample(1, ['landing.web.web-empty.default']);
  assert.notEqual(r.web, 'landing.web.web-empty.default');
  assert.ok(r.compose.includes('.compose.'));
});

test('weakReasons: owner decision 5', () => {
  assert.deepEqual(weakReasons({ medians: { 'color-roles': 2, 'overall-polish': 3 } }), []);
  assert.equal(weakReasons({ medians: { 'color-roles': 1.5 } }).length, 1);
  assert.equal(weakReasons({ medians: { 'spacing-layout': 2 } }).length, 1, 'F9/F10 item below 2.5');
  assert.equal(weakReasons({ medians: { 'dark-mode': 2 } }).length, 0, 'other items only below 2');
  assert.equal(weakReasons({ medians: { 'overall-polish': 1 } }).length, 1, 'counted once');
  assert.equal(weakReasons({ medians: {}, auto: 2, missing: ['x'] }).length, 2);
});

test('keepDecision: targeted items must improve; regression drops of 1 or automated findings revert', () => {
  const targeted = [{ cell: 'a', items: ['spacing-layout'], before: { 'spacing-layout': 2 }, after: { 'spacing-layout': 3 } }];
  const ok = [{ cell: 'r', before: { 'color-roles': 3 }, after: { 'color-roles': 2.5 }, autoAfter: 0 }];
  assert.equal(keepDecision({ targeted, regression: ok }).keep, true);
  assert.equal(keepDecision({ targeted, regression: [{ ...ok[0], after: { 'color-roles': 2 } }] }).keep, false);
  assert.equal(keepDecision({ targeted, regression: [{ ...ok[0], autoAfter: 1 }] }).keep, false);
  assert.equal(keepDecision({ targeted: [{ ...targeted[0], after: { 'spacing-layout': 2 } }], regression: ok }).keep, false);
});

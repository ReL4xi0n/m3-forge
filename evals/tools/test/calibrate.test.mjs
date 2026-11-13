import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseRefName, splitReferences, evaluateCalibration, referenceRequest } from '../calibrate.mjs';
import { hashText, checkFrozen } from '../frozen.mjs';
import { ITEMS } from '../judge.mjs';

test('parseRefName: platform, style, screen, theme, n', () => {
  assert.deepEqual(parseRefName('android-expressive-settings-light-1.png'),
    { platform: 'android', style: 'expressive', screen: 'settings', theme: 'light', n: 1 });
  assert.deepEqual(parseRefName('web-current-product-detail-dark-2.png'),
    { platform: 'web', style: 'current', screen: 'product-detail', theme: 'dark', n: 2 });
  assert.equal(parseRefName('notes.txt'), null);
  assert.equal(parseRefName('android-settings.png'), null);
});

const names = [
  'android-expressive-settings-light-1.png', 'android-expressive-settings-dark-1.png', 'android-expressive-dashboard-light-1.png',
  'android-expressive-product-detail-light-1.png', 'android-expressive-onboarding-light-1.png', 'android-expressive-empty-light-1.png',
  'web-current-landing-light-1.png', 'web-current-settings-light-1.png', 'web-current-dashboard-light-1.png',
  'web-current-onboarding-light-1.png', 'web-current-empty-light-1.png', 'web-current-main-dark-1.png',
];

test('splitReferences: anchors and checks both cover both platforms, half each, deterministic', () => {
  const s = splitReferences(names);
  assert.equal(s.anchors.length + s.checks.length, 12);
  assert.equal(s.anchors.length, 6);
  for (const side of [s.anchors, s.checks]) {
    assert.equal(side.filter(n => n.startsWith('android-')).length, 3);
    assert.equal(side.filter(n => n.startsWith('web-')).length, 3);
  }
  assert.deepEqual(splitReferences([...names].reverse()), s);
  assert.throws(() => splitReferences(names.slice(0, 11)), /at least 12/);
});

test('referenceRequest: a neutral request line naming platform and screen type', () => {
  assert.equal(referenceRequest(parseRefName('web-current-settings-light-1.png')), 'A settings screen. Platform: web.');
  assert.equal(referenceRequest(parseRefName('android-classic-empty-dark-1.png')), 'An empty state screen. Platform: Android. Use the classic Material 3 style, not M3 Expressive.');
});

const score = (id, item, s) => ({ id, item, score: s, reason: 'r' });

test('evaluateCalibration: passes when check references are 3-ish and defects are caught', () => {
  const mapping = { r1: { kind: 'reference', name: 'a', theme: 'light' }, r2: { kind: 'reference', name: 'b', theme: 'dark' }, d1: { kind: 'defect', name: 'no-dark' } };
  const expected = { 'no-dark': { item: 'dark-mode', maxScore: 1 } };
  const scores = [
    ...ITEMS.map(i => score('r1', i, i === 'dark-mode' ? 0 : 3)), ...ITEMS.map(i => score('r2', i, 3)),
    ...ITEMS.map(i => score('d1', i, i === 'dark-mode' ? 0 : 2)),
  ];
  const r = evaluateCalibration({ scores, mapping, expected });
  assert.equal(r.pass, true, JSON.stringify(r.failures));
  assert.equal(r.referenceMeans['dark-mode'], 3, 'only the dark reference counts for dark-mode');
  assert.equal(r.defects['no-dark'].score, 0);
});

test('evaluateCalibration: fails on a low reference mean, a reference score below 2, or a missed defect', () => {
  const mapping = { r1: { kind: 'reference', name: 'a', theme: 'light' }, r2: { kind: 'reference', name: 'b', theme: 'light' }, d1: { kind: 'defect', name: 'no-dark' } };
  const expected = { 'no-dark': { item: 'dark-mode', maxScore: 1 } };
  const base = s => [...ITEMS.map(i => score('r1', i, 3)), ...ITEMS.map(i => score('r2', i, s)), ...ITEMS.map(i => score('d1', i, i === 'dark-mode' ? 1 : 2))];
  assert.equal(evaluateCalibration({ scores: base(3), mapping, expected }).pass, true);
  const low = evaluateCalibration({ scores: base(2), mapping, expected });
  assert.equal(low.pass, false, 'mean 2.5 < 2.75');
  const below = evaluateCalibration({ scores: [...ITEMS.map(i => score('r1', i, 3)), ...ITEMS.map(i => score('r2', i, i === 'color-roles' ? 1 : 3)), ...ITEMS.map(i => score('d1', i, i === 'dark-mode' ? 1 : 2))], mapping, expected });
  assert.equal(below.pass, false, 'a reference score of 1');
  const missed = evaluateCalibration({ scores: [...ITEMS.map(i => score('r1', i, 3)), ...ITEMS.map(i => score('r2', i, 3)), ...ITEMS.map(i => score('d1', i, 2))], mapping, expected });
  assert.equal(missed.pass, false, 'defect scored 2 on its item');
});

test('evaluateCalibration: dark-mode is not applicable to a light-only reference', () => {
  const mapping = { r1: { kind: 'reference', name: 'a', theme: 'light' } };
  const scores = ITEMS.map(i => score('r1', i, i === 'dark-mode' ? 0 : 3));
  assert.equal(evaluateCalibration({ scores, mapping, expected: {} }).pass, true);
});

test('frozen: hashes ignore CRLF; checkFrozen reports missing and changed files', () => {
  assert.equal(hashText(Buffer.from('a\r\nb\n')), hashText(Buffer.from('a\nb\n')));
  const root = mkdtempSync(join(tmpdir(), 'm3frz-'));
  mkdirSync(join(root, 'evals'));
  assert.equal(checkFrozen(root).ok, false);
  writeFileSync(join(root, 'evals', 'rubric.md'), 'r\n');
  writeFileSync(join(root, 'evals', 'judge.md'), 'j\n');
  writeFileSync(join(root, 'evals', 'frozen.json'), JSON.stringify({ rubric: hashText(Buffer.from('r\n')), judge: hashText(Buffer.from('j\n')) }));
  assert.equal(checkFrozen(root).ok, true);
  writeFileSync(join(root, 'evals', 'rubric.md'), 'r changed\n');
  assert.equal(checkFrozen(root).ok, false);
});

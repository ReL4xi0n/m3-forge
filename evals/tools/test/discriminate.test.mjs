import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formFactorOf, selectMix, discriminationPrompt, validateVerdicts, scoreDiscrimination } from '../discriminate.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const refs = [
  'android-m3-settings-light-1.png', 'android-m3-settings-dark-1.png', 'android-m3-empty-light-1.png',
  'webmobile-google-landing-light-1.png', 'web-google-landing-light-1.png', 'web-google-app-dark-1.png',
];
const gen = [
  { cell: 'a.web', file: 'a/light-412x915.png', theme: 'light', viewport: '412x915' },
  { cell: 'a.web', file: 'a/light-1440x900.png', theme: 'light', viewport: '1440x900' },
  { cell: 'a.web', file: 'a/dark-1440x900.png', theme: 'dark', viewport: '1440x900' },
  { cell: 'b.flutter', file: 'b/light.png', theme: 'light', viewport: '412x915' },
  { cell: 'b.flutter', file: 'b/dark.png', theme: 'dark', viewport: '412x915' },
  { cell: 'c.compose', file: 'c/light.png', theme: 'light', viewport: '412x915' },
  { cell: 'd.web', file: 'd/dark-1440x900.png', theme: 'dark', viewport: '1440x900' },
  { cell: 'e.web', file: 'e/light-1440x900.png', theme: 'light', viewport: '1440x900' },
  { cell: 'f.compose', file: 'f/dark.png', theme: 'dark', viewport: '412x915' },
];

test('formFactorOf: phones are Android, mobile web and 412-wide shots; desktop is 1440-wide web', () => {
  assert.equal(formFactorOf({ ref: 'android-m3-form-dark-1.png' }), 'phone');
  assert.equal(formFactorOf({ ref: 'webmobile-google-signup-light-1.png' }), 'phone');
  assert.equal(formFactorOf({ ref: 'web-google-dashboard-light-1.png' }), 'desktop');
  assert.equal(formFactorOf({ viewport: '412x915' }), 'phone');
  assert.equal(formFactorOf({ viewport: '1440x900' }), 'desktop');
});

test('selectMix: as many generated images as references, matched by form factor and theme, one per cell, same seed same mix', () => {
  const a = selectMix({ references: refs, generated: gen, seed: 7 });
  const b = selectMix({ references: refs, generated: gen, seed: 7 });
  assert.deepEqual(a, b);
  const real = a.items.filter(i => i.source === 'real');
  const made = a.items.filter(i => i.source === 'generated');
  assert.equal(real.length, refs.length);
  assert.equal(made.length, refs.length);
  const key = i => `${i.formFactor}/${i.theme}`;
  const count = xs => xs.reduce((m, i) => ({ ...m, [key(i)]: (m[key(i)] ?? 0) + 1 }), {});
  assert.deepEqual(count(made), count(real));
  assert.equal(new Set(made.map(i => i.cell)).size, made.length, 'at most one image per cell');
  assert.equal(new Set(a.items.map(i => i.id)).size, a.items.length);
  assert.ok(a.items.every(i => /^[a-z0-9]{6}$/.test(i.id)));
  assert.notDeepEqual(a.items.map(i => i.source), [...real, ...made].map(i => i.source), 'order is shuffled');
});

test('selectMix: a bucket with too few generated images is reported, never filled from another bucket', () => {
  const r = selectMix({ references: refs, generated: gen.filter(g => g.theme === 'light'), seed: 1 });
  assert.ok(r.shortfall.some(s => s.bucket === 'phone/dark' && s.missing === 1));
  assert.ok(r.items.filter(i => i.source === 'generated').every(i => i.theme === 'light'));
});

test('discriminationPrompt: lists the ids and never says how many images are real', () => {
  const p = discriminationPrompt({ ids: ['aaaaaa', 'bbbbbb'], root });
  assert.match(p, /aaaaaa, bbbbbb/);
  assert.match(p, /real Google product/);
  assert.doesNotMatch(p, /\bhalf\b|\b\d+ (of them|are real)\b/i);
  assert.doesNotMatch(p, /rubric|score 3/i, 'the discrimination judge does not see the rubric');
});

test('validateVerdicts: every id once, a real/generated verdict, a probability, a known cue and a reason', () => {
  const ok = JSON.stringify([
    { id: 'aaaaaa', verdict: 'real', pReal: 0.9, cue: 'design', reason: 'x' },
    { id: 'bbbbbb', verdict: 'generated', pReal: 0.2, cue: 'brand', reason: 'y' },
  ]);
  assert.equal(validateVerdicts(`Here:\n${ok}`, ['aaaaaa', 'bbbbbb']).ok, true);
  const bad = validateVerdicts(JSON.stringify([{ id: 'aaaaaa', verdict: 'maybe', pReal: 2, cue: 'vibes', reason: '' }]), ['aaaaaa', 'bbbbbb']);
  assert.equal(bad.ok, false);
  for (const p of ['bad verdict', 'bad pReal', 'bad cue', 'no reason', 'missing bbbbbb']) assert.ok(bad.problems.some(x => x.includes(p)), p);
});

test('scoreDiscrimination: accuracy, per-class recall, AUC and accuracy by cue', () => {
  const truth = { r1: 'real', r2: 'real', g1: 'generated', g2: 'generated' };
  const verdicts = [
    { id: 'r1', verdict: 'real', pReal: 0.9, cue: 'brand' },
    { id: 'r2', verdict: 'generated', pReal: 0.4, cue: 'design' },
    { id: 'g1', verdict: 'generated', pReal: 0.1, cue: 'design' },
    { id: 'g2', verdict: 'generated', pReal: 0.4, cue: 'content' },
  ];
  const s = scoreDiscrimination(verdicts, truth);
  assert.equal(s.n, 4);
  assert.equal(s.accuracy, 0.75);
  assert.equal(s.realRecall, 0.5);
  assert.equal(s.generatedRecall, 1);
  // Pairs (real, generated): (0.9,0.1)=1 (0.9,0.4)=1 (0.4,0.1)=1 (0.4,0.4)=0.5 → 3.5/4.
  assert.equal(s.auc, 0.875);
  assert.deepEqual(s.byCue.design, { n: 2, correct: 1 });
  assert.deepEqual(s.byCue.brand, { n: 1, correct: 1 });
});

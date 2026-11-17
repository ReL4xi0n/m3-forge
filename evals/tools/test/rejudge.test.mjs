import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compareJudged, renderJudgeComparison, shotsOf } from '../rejudge.mjs';

test('shotsOf: harness v2 screenshots win over the recorded ones', () => {
  const priv = mkdtempSync(join(tmpdir(), 'm3-rejudge-'));
  for (const [dir, name] of [['c1', 'light-412x915.png'], ['c1/v2', 'light-412x915.png'], ['c2', 'dark-1440x900.png']]) {
    mkdirSync(join(priv, dir, 'shots'), { recursive: true });
    writeFileSync(join(priv, dir, 'shots', name), 'png');
    writeFileSync(join(priv, dir, 'capture.json'), JSON.stringify({ shots: [{ file: `${String.raw`C:\m3-eval\shots\x`}\\${name}`, theme: 'light', viewport: '412x915' }] }));
  }
  assert.equal(shotsOf(priv, 'c1').harness, 'v2');
  assert.ok(shotsOf(priv, 'c1').shots[0].file.includes(join('c1', 'v2', 'shots')));
  assert.equal(shotsOf(priv, 'c2').harness, 'v1');
  assert.deepEqual(shotsOf(priv, 'nope'), { harness: null, shots: [] });
});

test('compareJudged and renderJudgeComparison: v1 and v2 side by side', () => {
  const items = ['component-choice', 'hierarchy-typography', 'color-roles', 'shape-expressive', 'spacing-layout', 'interaction-states', 'dark-mode', 'overall-polish'];
  const all = s => Object.fromEntries(items.map(i => [i, s]));
  const rows = [{ cell: 'a.web', platform: 'web', v1: all(3), v2: all(2) }, { cell: 'b.flutter', platform: 'flutter', v1: all(1), v2: all(2) }];
  const c = compareJudged(rows);
  assert.equal(c.byPlatform.web.v1['overall-polish'], 3);
  assert.equal(c.byPlatform.web.v2['overall-polish'], 2);
  assert.deepEqual(c.overall.threes, { v1: 8, v2: 0, of: 16 });
  assert.match(renderJudgeComparison('r', rows), /\| a\.web \| 3 → 2 \|/);
});

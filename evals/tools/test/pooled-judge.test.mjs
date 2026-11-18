import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRunSpecs, renderPooled } from '../pooled-judge.mjs';

test('parseRunSpecs: run, condition and an optional cell list per --run', () => {
  assert.deepEqual(parseRunSpecs(['--id', 'p', '--run', 'dev-a-r1:skill', '--run', 'dev-b-r1:baseline:x,y']), [
    { runId: 'dev-a-r1', condition: 'skill', cells: null },
    { runId: 'dev-b-r1', condition: 'baseline', cells: ['x', 'y'] },
  ]);
  assert.throws(() => parseRunSpecs(['--run', 'only-run']), /runId>:<condition/);
});

test('renderPooled: one mean row per run and one row per output', () => {
  const rows = [
    { runId: 'r1', condition: 'skill', cell: 'a', scores: { 'component-choice': 2 } },
    { runId: 'r1', condition: 'skill', cell: 'b', scores: { 'component-choice': 3 } },
    { runId: 'r2', condition: 'baseline', cell: 'a', scores: { 'component-choice': 1 } },
  ];
  const md = renderPooled('p', rows);
  assert.match(md, /\| r1 \(skill\) \| 2 \| 2\.50 \|/);
  assert.match(md, /\| r2 \(baseline\) \| 1 \| 1\.00 \|/);
  assert.equal((md.match(/^\| r\d \(\w+\) \| [ab] \|/gm) ?? []).length, 3);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cellId, microCell, promptFor, rowHits, aggregate, renderSummary, ROWS } from '../microtest.mjs';

test('cell ids and prompts', () => {
  assert.equal(cellId('F7', 'skill', 2), 'micro.F7.skill.r2');
  assert.equal(microCell('F7', 'control', 1).set, 'dev');
  assert.equal(promptFor('F12', 'skill'), `/material3 ${ROWS.F12.task}`);
  assert.equal(promptFor('F12', 'control'), ROWS.F12.task);
});

test('rowHits picks the row checks only', () => {
  const ver = { violations: [{ check: 'icon-source', file: 'a', line: 1 }, { check: 'unknown-icon', file: 'a', line: 2 }, { check: 'brand', file: 'b', line: 3 }, { check: 'contrast' }] };
  assert.equal(rowHits('F7', ver).length, 2);
  assert.equal(rowHits('F12', ver).length, 1);
  assert.equal(rowHits('F11', ver).length, 0);
  assert.deepEqual(rowHits('F7', null), []);
});

test('aggregate and summary', () => {
  const recs = [
    { cell: 'micro.F7.skill.r1', row: 'F7', arm: 'skill', status: 'ok', costUsd: 0.5, hits: [{ check: 'icon-source', file: 'i.html', line: 4, source: '<i>' }] },
    { cell: 'micro.F7.skill.r2', row: 'F7', arm: 'skill', status: 'ok', costUsd: 0.25, hits: [] },
  ];
  const a = aggregate(recs)['F7|skill'];
  assert.deepEqual([a.runs, a.runsWithHit, a.hits, a.costUsd], [2, 1, 1, 0.75]);
  const md = renderSummary({ runId: 'x', records: recs, verdicts: { 'micro.F7.skill.r1:i.html:4:icon-source': 'false' } });
  assert.match(md, /\| F7 \| icon-source \+ unknown-icon \| skill \| 2 \| 1 \| 1 \| 0.75 \| 0 \|/);
  assert.match(md, /\| false \|/);
});

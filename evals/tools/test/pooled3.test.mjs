import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { combineSessions, median, renderPooled3, shotsOfRecord } from '../pooled3.mjs';
import { ITEMS } from '../judge.mjs';

test('median: odd, even and missing sessions', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([2, 1, 1]), 1);
  assert.equal(median([3, null, 2]), 2.5, 'a failed session leaves the median of the other two');
  assert.equal(median([null, null, 2]), 2);
  assert.equal(median([null]), null);
});

test('combineSessions: scores join by mapping per session; the median is the score of record', () => {
  const outputs = [{ runId: 'b', cell: 'c1', condition: 'baseline', repeat: 1 }, { runId: 'f', cell: 'c1', condition: 'skill', repeat: 1 }];
  const m = (o) => ({ cell: o.cell, condition: o.condition, repeat: o.repeat, runId: o.runId });
  const sessions = [
    { mapping: { x1: m(outputs[0]), x2: m(outputs[1]) }, scores: [{ id: 'x1', item: ITEMS[0], score: 1 }, { id: 'x2', item: ITEMS[0], score: 3 }] },
    { mapping: { y1: m(outputs[1]), y2: m(outputs[0]) }, scores: [{ id: 'y2', item: ITEMS[0], score: 2 }, { id: 'y1', item: ITEMS[0], score: 2 }] },
    { mapping: { z1: m(outputs[0]), z2: m(outputs[1]) }, scores: [{ id: 'z1', item: ITEMS[0], score: 2 }, { id: 'z2', item: ITEMS[0], score: 3 }] },
  ];
  const rows = combineSessions(outputs, sessions);
  assert.deepEqual(rows[0].sessions[ITEMS[0]], [1, 2, 2]);
  assert.equal(rows[0].median[ITEMS[0]], 2);
  assert.deepEqual(rows[1].sessions[ITEMS[0]], [3, 2, 3]);
  assert.equal(rows[1].median[ITEMS[0]], 3);
  assert.equal(rows[1].median[ITEMS[1]], null);
  const md = renderPooled3('t', rows, { sessions: 3, platformOf: () => 'web' });
  assert.match(md, /\| f \(skill\) \| c1 \| 3 \(3\/2\/3\)/);
});

test('shotsOfRecord: harness v3 re-captures win over the run folder', () => {
  const base = mkdtempSync(join(tmpdir(), 'p3-'));
  const put = (sub) => {
    const dir = sub ? join(base, 'cell', sub) : join(base, 'cell');
    mkdirSync(join(dir, 'shots'), { recursive: true });
    writeFileSync(join(dir, 'shots', 'a.png'), 'x');
    writeFileSync(join(dir, 'capture.json'), JSON.stringify({ shots: [{ file: String.fromCharCode(67,58,92)+'somewhere'+String.fromCharCode(92)+'a.png', theme: 'light' }] }));
  };
  put('');
  assert.equal(shotsOfRecord(base, 'cell').harness, 'run');
  put('v2');
  assert.equal(shotsOfRecord(base, 'cell').harness, 'v2');
  put('compose-v3');
  assert.equal(shotsOfRecord(base, 'cell').harness, 'compose-v3');
  put('v3');
  const r = shotsOfRecord(base, 'cell');
  assert.equal(r.harness, 'v3');
  assert.equal(r.shots[0].file, join(base, 'cell', 'v3', 'shots', 'a.png'));
  assert.equal(shotsOfRecord(base, 'none').shots.length, 0);
});

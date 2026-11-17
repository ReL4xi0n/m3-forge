import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildScores, failureCatalogue, renderSummary } from '../report.mjs';

const cells = [
  { cell: 'a.web.web-empty.default', request: 'a', platform: 'web', fixture: 'web-empty', variant: 'default' },
  { cell: 'a.flutter.flutter-material_ui.default', request: 'a', platform: 'flutter', fixture: 'flutter-material_ui', variant: 'default' },
  { cell: 'b.web.web-react.default', request: 'b', platform: 'web', fixture: 'web-react', variant: 'default' },
];
const row = (cell, judged, extra = {}) => ({
  cell, status: 'ok', durationMs: 120000, costUsd: 1.5, buildOk: true, reason: null, captureMs: 60000, shots: 4,
  violations: { 'hardcoded-color': 0, contrast: 0, 'touch-target': 0 }, uiLines: 100,
  automated: { 'token-fidelity': 2, 'contrast-targets': 3, 'anti-patterns': 1 },
  judged, reasons: { 'color-roles': { score: judged['color-roles'], reason: 'private text' } },
  isolation: { init: true, audit: true, preflight: true, warnings: 2 }, ...extra,
});
const summary = {
  runId: 'r1', stopped: null,
  canaries: [{ id: 'c1', pass: true }],
  summary: [
    row(cells[0].cell, { 'color-roles': 3, 'dark-mode': 1 }, { violations: { 'hardcoded-color': 5, contrast: 0, 'touch-target': 2 } }),
    row(cells[1].cell, { 'color-roles': 2, 'dark-mode': 0 }, { recaptured: true, violations: { 'hardcoded-color': 1, contrast: 0, 'touch-target': 0 } }),
    row(cells[2].cell, { 'color-roles': 1, 'dark-mode': 2 }, { buildOk: false, shots: 0, reason: 'vite build failed' }),
  ],
};

test('buildScores: one public row per cell with its axes, and no judge reasons', () => {
  const s = buildScores(summary, cells);
  assert.equal(s.cells.length, 3);
  const a = s.cells[0];
  assert.equal(a.platform, 'web');
  assert.equal(a.request, 'a');
  assert.deepEqual(a.judged, { 'color-roles': 3, 'dark-mode': 1 });
  assert.equal(a.durationMin, 2);
  assert.equal(JSON.stringify(s).includes('private text'), false, 'judge reasons stay private');
  assert.equal(s.cells[1].recaptured, true);
});

test('buildScores: item means by platform and overall, over every cell', () => {
  const s = buildScores(summary, cells);
  assert.equal(s.byPlatform.web['color-roles'], 2);
  assert.equal(s.byPlatform.flutter['dark-mode'], 0);
  assert.equal(s.overall['dark-mode'], 1);
  assert.equal(s.overall['token-fidelity'], 2);
  assert.equal(s.totals.costUsd, 4.5);
  assert.equal(s.totals.cells, 3);
});

test('failureCatalogue: violation kinds, low judged items and build failures with frequency and example cells', () => {
  const f = failureCatalogue(summary, cells);
  const hc = f.find(x => x.type === 'verify: hardcoded-color');
  assert.equal(hc.cells, 2);
  assert.equal(hc.instances, 6);
  assert.deepEqual(hc.examples, [cells[0].cell, cells[1].cell]);
  assert.equal(f.some(x => x.type === 'verify: contrast'), false, 'a kind no cell has is not a failure');
  const dm = f.find(x => x.type === 'judged ≤1: dark-mode');
  assert.equal(dm.cells, 2);
  assert.equal(f.find(x => x.type === 'build/capture failed').cells, 1);
  assert.ok(f.indexOf(hc) < f.indexOf(f.find(x => x.type === 'build/capture failed')), 'sorted by frequency');
});

test('renderSummary: tables for items by platform, violations, the catalogue and isolation', () => {
  const md = renderSummary(summary, cells, { title: 'Baseline' });
  for (const h of ['# Baseline', '## Scores by item and platform', '## Automated violation counts', '## Failure catalogue', '## Isolation']) assert.match(md, new RegExp(h));
  assert.match(md, /\| color-roles \| 2\.00 \| 2\.00 \|/);
  assert.match(md, /a\.flutter\.flutter-material_ui\.default.*recaptured/);
  assert.doesNotMatch(md, /private text/);
});

// The scored instrument did not move: re-scoring the recorded baseline gives the committed
// evals/runs/2026-11-17-baseline/automated-v2.json byte for byte. With the private run data (record.json
// per cell and the recorded work folders) verify runs again on every work folder; without it, the
// committed counts are scored again (every baseline cell built and has shots, per the private detail).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { automatedScores } from '../automated.mjs';
import { publicJson, scoreCell } from '../rescore-automated.mjs';
import { verify } from '../../../plugin/skills/material3/scripts/verify/index.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const RUN_ID = 'baseline-2026-11-17';
const PUBLIC = join(root, 'evals', 'runs', '2026-11-17-baseline', 'automated-v2.json');
const PRIV = join(root, 'private', 'evals', 'runs', RUN_ID);
const committed = readFileSync(PUBLIC, 'utf8');

function recorded() {
  const cells = JSON.parse(readFileSync(join(root, 'evals', 'cells.json'), 'utf8'));
  const out = [];
  for (const cell of cells) {
    const recPath = join(PRIV, cell.cell, 'record.json');
    if (!existsSync(recPath)) return null;
    const saved = JSON.parse(readFileSync(recPath, 'utf8'));
    if (!existsSync(saved.rec?.workDir ?? '')) return null;
    const v2cap = join(PRIV, cell.cell, 'v2', 'capture.json');
    out.push({ cell, saved, cap: existsSync(v2cap) ? JSON.parse(readFileSync(v2cap, 'utf8')) : saved.cap });
  }
  return out;
}

const data = recorded();

test('re-running verify on the recorded baseline work folders reproduces automated-v2.json byte for byte', { skip: data ? false : 'private run data or work folders absent' }, async () => {
  const rows = [];
  const detail = [];
  for (const { cell, saved, cap } of data) {
    const ver = await verify({ projectDir: saved.rec.workDir, platform: cell.platform, runtime: cap.runtime });
    const s = scoreCell(cell, saved, cap, ver);
    rows.push(s.row);
    detail.push(s.detail);
  }
  assert.equal(publicJson(RUN_ID, rows, detail), committed);
});

test('scoring the committed counts again reproduces automated-v2.json byte for byte', () => {
  const pub = JSON.parse(committed);
  const rows = [];
  const detail = [];
  for (const c of pub.cells) {
    const { counts, uiLines, ...row } = c;
    rows.push({ ...row, v2: automatedScores({ counts, uiLines }, true, 'v2') });
    detail.push({ countsV2: counts, uiLines });
  }
  assert.equal(publicJson(pub.runId, rows, detail), committed);
});

test('the unscored verify checks are in no automated band, and verify keeps them out of counts', async () => {
  const { BANDS } = await import('../automated.mjs');
  const { CHECKS, UNSCORED_CHECKS } = await import('../../../plugin/skills/material3/scripts/verify/index.mjs');
  const banded = new Set(Object.values(BANDS).flatMap(v => Object.values(v).flatMap(b => b.checks)));
  for (const c of UNSCORED_CHECKS) {
    assert.ok(!banded.has(c), `${c} is scored`);
    assert.ok(!CHECKS.includes(c), `${c} is in counts`);
  }
  assert.deepEqual(UNSCORED_CHECKS, ['placeholder-content', 'brand', 'unknown-icon', 'asset-unused', 'icon-button-label']);
});

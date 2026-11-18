#!/usr/bin/env node
// Compose harness v3 (owner decision 2026-11-18): the touch target is measured with the padding that
// minimumInteractiveComponentSize() adds, so the official 40 dp buttons and 32 dp chips are no longer
// reported. The recorded code of the baseline Compose cells is captured again with v3 (no cell is run
// again) and scored again with the frozen automated items v2; the old numbers (harness v2, layout size)
// stand next to the new ones. The screenshots do not depend on the measurement: they are compared byte
// for byte with the earlier capture, and the judge v2 scores of identical pictures cannot change, so the
// judge is not run again (a hash match is the proof; a mismatch makes the tool exit with code 3).
//   node evals/tools/harness-compose-v3.mjs --run-id baseline-2026-11-17 --out evals/runs/2026-11-17-baseline
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { automatedScores } from './automated.mjs';
import { evalCells } from './cells.mjs';
import { stopGradle } from './pipeline.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const mean = (xs) => { const v = xs.filter((x) => typeof x === 'number'); return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null; };
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const ITEMS = ['contrast-targets', 'token-fidelity', 'anti-patterns', 'icon-source'];

async function main() {
  const runId = arg('--run-id');
  const out = arg('--out');
  if (!runId) { console.error('usage: harness-compose-v3.mjs --run-id <id> [--out <public folder>]'); process.exit(2); }
  const priv = join(root, 'private', 'evals', 'runs', runId);
  const { verify } = await import('../../plugin/skills/material3/scripts/verify/index.mjs');
  const { captureCompose } = await import('../../harness/compose/capture.mjs');
  const rows = [];
  for (const cell of evalCells().filter((c) => c.platform === 'compose')) {
    const saved = JSON.parse(readFileSync(join(priv, cell.cell, 'record.json'), 'utf8'));
    const workDir = saved.rec.workDir;
    if (!existsSync(workDir ?? '')) throw new Error(`work folder gone for ${cell.cell}: ${workDir}`);
    const old = JSON.parse(readFileSync(join(priv, cell.cell, 'v2', 'capture.json'), 'utf8'));
    const shotDir = join('C:\\m3-eval', 'shots', `${runId}-compose-v3`, cell.cell);
    rmSync(shotDir, { recursive: true, force: true });
    const t0 = Date.now();
    stopGradle(workDir);
    const cap = await captureCompose({ projectDir: workDir, outDir: shotDir, version: 'v3' });
    stopGradle(workDir);
    cap.shots = cap.shots.map((s) => ({ ...s, file: isAbsolute(s.file) ? s.file : join(shotDir, s.file) }));
    const oldDir = join(priv, cell.cell, 'v2', 'shots');
    const same = cap.shots.length > 0 && cap.shots.every((s) => { const o = join(oldDir, s.file.split(/[\\/]/).pop()); return existsSync(o) && sha(o) === sha(s.file); });
    const dest = join(priv, cell.cell, 'compose-v3');
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    cpSync(shotDir, join(dest, 'shots'), { recursive: true });
    writeFileSync(join(dest, 'capture.json'), JSON.stringify({ ...cap, raw: undefined, harness: 'compose-v3' }, null, 2));
    const ver = await verify({ projectDir: workDir, platform: 'compose', runtime: cap.runtime });
    const oldVer = await verify({ projectDir: workDir, platform: 'compose', runtime: old.runtime });
    rows.push({
      cell: cell.cell,
      v2: automatedScores(oldVer, Boolean(old.buildOk && old.shots?.length), 'v2'),
      v3: automatedScores(ver, Boolean(cap.buildOk && cap.shots.length), 'v2'),
      targets: { v2: oldVer.counts['touch-target'], v3: ver.counts['touch-target'] },
      contrast: { v2: oldVer.counts.contrast, v3: ver.counts.contrast },
      shotsIdentical: same,
    });
    console.log(cell.cell, 'buildOk', cap.buildOk, 'targets', oldVer.counts['touch-target'], '->', ver.counts['touch-target'], 'pictures identical', same, `${Math.round((Date.now() - t0) / 1000)}s`);
  }
  writeFileSync(join(priv, 'automated-compose-v3.json'), JSON.stringify({ runId, at: new Date().toISOString(), rows }, null, 2));
  if (out) {
    const md = [
      `# Compose harness v3: baseline Compose cells, old and new touch-target measurement (run \`${runId}\`)`,
      '',
      'Harness v2 measured the layout size of every clickable, so each official 40 dp button and 32 dp chip was a touch-target finding. Harness v3 (`harness/compose/`, `-Pm3.targets=touch`) measures the touch target with the padding `minimumInteractiveComponentSize()` adds around it; a bare clickable below 48 dp is still reported. v2 stays selectable (`version: "v2"`) to reproduce the old numbers. The recorded code of the 8 baseline Compose cells was captured again with v3 (no cell was run again) and scored again with the frozen automated items v2.',
      '',
      `The v3 screenshots are byte-identical to the earlier ones in ${rows.filter((r) => r.shotsIdentical).length}/${rows.length} cells (SHA-256 per picture). The measurement does not touch the picture, so the judge v2 scores (all visual items) of an identical picture cannot change; the judge was not run again. Only the automated item contrast-targets depends on the measurement.`,
      '',
      '## Means (8 Compose cells)',
      '',
      `| harness | ${ITEMS.join(' | ')} | touch-target findings |`,
      `|---|${ITEMS.map(() => '---').join('|')}|---|`,
      ...['v2', 'v3'].map((h) => `| compose ${h} | ${ITEMS.map((it) => mean(rows.map((r) => r[h][it]))?.toFixed(2) ?? '—').join(' | ')} | ${rows.reduce((a, r) => a + r.targets[h], 0)} |`),
      '',
      '## Per cell (v2 → v3)',
      '',
      '| cell | contrast-targets | touch-target findings | contrast findings | pictures identical |',
      '|---|---|---|---|---|',
      ...rows.map((r) => `| ${r.cell} | ${r.v2['contrast-targets']} → ${r.v3['contrast-targets']} | ${r.targets.v2} → ${r.targets.v3} | ${r.contrast.v2} → ${r.contrast.v3} | ${r.shotsIdentical ? 'yes' : 'NO'} |`),
      '',
    ].join('\n');
    mkdirSync(join(root, out), { recursive: true });
    writeFileSync(join(root, out, 'compose-harness-v3.md'), md);
    writeFileSync(join(root, out, 'compose-harness-v3.json'), `${JSON.stringify({ runId, rows }, null, 2)}\n`);
    console.log(`wrote ${out}/compose-harness-v3.md`);
  }
  if (rows.some((r) => !r.shotsIdentical)) { console.error('pictures differ: judge v2 must run again'); process.exitCode = 3; }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

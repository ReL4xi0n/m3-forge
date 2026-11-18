#!/usr/bin/env node
// Re-checks the recorded Compose dev outputs (last run of each dev cell) with the corrected tools, without
// a new round (owner decision 2026-11-18, 3d gate):
//   - harness v3 capture (touch targets include minimumInteractiveComponentSize) and verify on every cell;
//   - the plant-shop empty-result state again with the skill's screenshot step, where enterText now fails a
//     state whose text does not show up in a text field.
//   node evals/tools/compose-recheck.mjs --out evals/runs/dev-compose [--skip-capture] [--skip-state]
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import { stopGradle } from './pipeline.mjs';
import { withToolchain } from './toolchain-env.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const has = (k) => process.argv.includes(k);
const runs = join(root, 'private', 'evals', 'runs');

// The last run of each cell (the one the dev summary reports).
const FINAL = [
  ['dev-2026-11-18-compose-r1', 'podcast-player.compose.compose-1.5.default', 'podcast-player (skill, r1)'],
  ['dev-2026-11-18-compose-r1', 'clinic-schedule.compose.compose-1.5.default', 'clinic-schedule (skill, r1)'],
  ['dev-2026-11-18-compose-r2', 'expense-report.compose.compose-1.5.seed-2F6F5E', 'expense-report (skill, r2)'],
  ['dev-2026-11-18-compose-r2', 'plant-shop.compose.compose-1.5.classic', 'plant-shop (skill, r2)'],
  ['dev-2026-11-18-composenonode-r3', 'plant-shop.compose.compose-1.5.classic', 'plant-shop (no Node, r3)'],
];

const record = (run, cell) => JSON.parse(readFileSync(join(runs, run, cell, 'record.json'), 'utf8'));

async function recapture() {
  const { verify } = await import('../../plugin/skills/material3/scripts/verify/index.mjs');
  const { captureCompose } = await import('../../harness/compose/capture.mjs');
  const rows = [];
  for (const [run, cell, label] of FINAL) {
    const saved = record(run, cell);
    const workDir = saved.rec.workDir;
    if (!existsSync(workDir ?? '')) throw new Error(`work folder gone: ${workDir}`);
    const shotDir = join('C:\\m3-eval', 'shots', `${run}-compose-v3`, cell);
    rmSync(shotDir, { recursive: true, force: true });
    const t0 = Date.now();
    stopGradle(workDir);
    const cap = await captureCompose({ projectDir: workDir, outDir: shotDir, version: 'v3' });
    stopGradle(workDir);
    const ver = await verify({ projectDir: workDir, platform: 'compose', runtime: cap.runtime });
    const oldCap = saved.cap ?? {};
    const row = {
      label, run, cell, buildOk: cap.buildOk, harness: cap.harness,
      touchTargets: cap.runtime.targets.length, contrast: cap.runtime.contrast.length,
      touchTargetsBefore: oldCap.runtime?.targets?.length ?? null,
      verify: ver.counts,
      targets: cap.runtime.targets.map((t) => `${t.where} | ${t.detail}`),
      contrastDetail: cap.runtime.contrast.map((t) => `${t.where} | ${t.detail}`),
      seconds: Math.round((Date.now() - t0) / 1000),
    };
    rows.push(row);
    console.log(label, 'buildOk', cap.buildOk, 'targets', row.touchTargetsBefore, '->', row.touchTargets, 'contrast', row.contrast, `${row.seconds}s`);
  }
  return rows;
}

async function emptyState() {
  const [run, cell] = FINAL[3];
  const saved = record(run, cell);
  const workDir = saved.rec.workDir;
  const states = JSON.parse(readFileSync(join('C:\\m3-eval', 'appdata', run, cell, 'Temp', 'greenleafe-states.json'), 'utf8'));
  const only = { states: states.states.filter((s) => s.name === 'empty-search') };
  const statesFile = join(process.env.TEMP ?? '.', 'm3-recheck-states.json');
  writeFileSync(statesFile, JSON.stringify(only));
  const { screenshot } = await import(pathToFileURL(join(root, 'plugin', 'skills', 'material3', 'scripts', 'screenshot', 'index.mjs')).href);
  stopGradle(workDir);
  const r = await screenshot({ projectDir: workDir, platform: 'compose', env: withToolchain(process.env), states: only });
  stopGradle(workDir);
  const dest = join(runs, run, cell, 'recheck-empty-search');
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const s of r.states?.flatMap((x) => x.shots ?? []) ?? []) cpSync(s, join(dest, s.split(/[\\/]/).pop()));
  const out = { ran: r.ran, skippedReason: r.skippedReason, states: r.states, warnings: r.warnings };
  writeFileSync(join(dest, 'result.json'), JSON.stringify(out, null, 2));
  console.log('empty-search', JSON.stringify(out.states), out.skippedReason ?? '');
  return out;
}

const out = arg('--out');
const result = {};
if (!has('--skip-capture')) result.cells = await recapture();
if (!has('--skip-state')) result.emptySearch = await emptyState();
writeFileSync(join(runs, 'compose-recheck.json'), JSON.stringify({ at: new Date().toISOString(), ...result }, null, 2));
if (out) {
  mkdirSync(join(root, out), { recursive: true });
  const md = [
    '# Compose dev outputs re-checked with the corrected tools (no new round)',
    '',
    '| cell | build | touch targets before (layout size) | touch targets now (harness v3) | contrast | verify touch-target / contrast |',
    '|---|---|---|---|---|---|',
    ...(result.cells ?? []).map((r) => `| ${r.label} | ${r.buildOk ? 'ok' : 'FAILED'} | ${r.touchTargetsBefore ?? '—'} | ${r.touchTargets} | ${r.contrast} | ${r.verify['touch-target'] ?? 0} / ${r.verify.contrast ?? 0} |`),
    '',
    ...((result.cells ?? []).filter((r) => r.touchTargets || r.contrast).flatMap((r) => [`## ${r.label}`, '', ...r.targets.map((t) => `- ${t}`), ...r.contrastDetail.map((t) => `- ${t}`), ''])),
    ...(result.emptySearch ? ['## plant-shop, state `empty-search` again (enterText now fails a state whose text is not in a field)', '', '```json', JSON.stringify(result.emptySearch.states, null, 2), '```', ''] : []),
  ].join('\n');
  writeFileSync(join(root, out, 'recheck.md'), md);
  console.log(`wrote ${out}/recheck.md`);
}

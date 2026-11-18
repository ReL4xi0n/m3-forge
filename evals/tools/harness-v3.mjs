#!/usr/bin/env node
// Flutter harness v3 (owner decision 2026-11-18): the capture paints real elevation shadows instead of
// flutter_test's solid black outlines. The recorded baseline Flutter code is captured again with v3, scored
// again with the frozen automated items v2, and judged blind together with the v2 captures of the same code
// in ONE judge v2 session, so the old and the new screenshots face the same judge.
//   node evals/tools/harness-v3.mjs capture --run-id baseline-2026-11-17
//   node evals/tools/harness-v3.mjs judge   --run-id baseline-2026-11-17 --out evals/runs/2026-11-17-baseline
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { automatedScores } from './automated.mjs';
import { evalCells } from './cells.mjs';
import { ITEMS } from './judge.mjs';
import { cellTarget } from './pairing.mjs';
import { judgeRequest } from './pipeline.mjs';
import { judgeV2 } from './rejudge.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const mean = (xs) => { const v = xs.filter((x) => typeof x === 'number'); return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null; };

const flutterCells = () => evalCells().filter((c) => c.platform === 'flutter');
const shotsIn = (dir) => {
  const cap = join(dir, 'capture.json');
  if (!existsSync(cap)) return [];
  return (JSON.parse(readFileSync(cap, 'utf8')).shots ?? [])
    .map((s) => ({ ...s, file: join(dir, 'shots', basename(String(s.file).replace(/\\/g, '/'))) }))
    .filter((s) => existsSync(s.file));
};

async function capture(runId) {
  const priv = join(root, 'private', 'evals', 'runs', runId);
  const { verify } = await import('../../plugin/skills/material3/scripts/verify/index.mjs');
  const { captureFlutter } = await import('../../harness/flutter/capture.mjs');
  const rows = [];
  for (const cell of flutterCells()) {
    const saved = JSON.parse(readFileSync(join(priv, cell.cell, 'record.json'), 'utf8'));
    const workDir = saved.rec.workDir;
    if (!existsSync(workDir ?? '')) throw new Error(`work folder gone for ${cell.cell}: ${workDir}`);
    const shotDir = join('C:\\m3-eval', 'shots', `${runId}-v3`, cell.cell);
    rmSync(shotDir, { recursive: true, force: true });
    const t0 = Date.now();
    const cap = await captureFlutter({ projectDir: workDir, outDir: shotDir, version: 'v3' });
    cap.shots = cap.shots.map((s) => ({ ...s, file: isAbsolute(s.file) ? s.file : join(shotDir, s.file) }));
    const dest = join(priv, cell.cell, 'v3');
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    cpSync(shotDir, join(dest, 'shots'), { recursive: true });
    writeFileSync(join(dest, 'capture.json'), JSON.stringify({ ...cap, raw: undefined, harness: 'v3' }, null, 2));
    const ver = await verify({ projectDir: workDir, platform: 'flutter', runtime: cap.runtime });
    const usable = Boolean(cap.buildOk && cap.shots.length);
    const v2cap = JSON.parse(readFileSync(join(priv, cell.cell, 'v2', 'capture.json'), 'utf8'));
    const v2ver = await verify({ projectDir: workDir, platform: 'flutter', runtime: v2cap.runtime });
    rows.push({ cell: cell.cell, v2: automatedScores(v2ver, Boolean(v2cap.buildOk && v2cap.shots?.length), 'v2'), v3: automatedScores(ver, usable, 'v2'), counts: { v2: v2ver.counts, v3: ver.counts } });
    console.log(cell.cell, 'v3', cap.buildOk, 'shots', cap.shots.length, `${Math.round((Date.now() - t0) / 1000)}s`);
  }
  writeFileSync(join(priv, 'automated-v3.json'), JSON.stringify({ runId, at: new Date().toISOString(), rows }, null, 2));
  console.log('wrote automated-v3.json');
}

async function judge(runId, out) {
  const priv = join(root, 'private', 'evals', 'runs', runId);
  const outputs = [];
  for (const cell of flutterCells()) {
    for (const [h, dir] of [['v2', join(priv, cell.cell, 'v2')], ['v3', join(priv, cell.cell, 'v3')]]) {
      const shots = shotsIn(dir);
      if (shots.length) outputs.push({ cell: cell.cell, condition: `harness-${h}`, repeat: 1, runId: `${runId}-${h}`, request: judgeRequest(cell, root), shots, target: cellTarget(cell) });
    }
  }
  const stamp = Date.now();
  const dest = join(priv, 'judge-harness-v3');
  mkdirSync(dest, { recursive: true });
  const { probeBuiltIns } = await import('./isolation.mjs');
  const r = await judgeV2({ root, outputs, judgeDir: join('C:\\m3-eval', 'judge-in', `${runId}-h3-${stamp}`), mappingPath: join(dest, 'mapping.json'), batchPrefix: `${runId}-h3-${stamp}`, builtIns: probeBuiltIns() });
  const mapping = JSON.parse(readFileSync(join(dest, 'mapping.json'), 'utf8'));
  const by = {};
  for (const s of r.scores) { const m = mapping[s.id]; (by[`${m.runId}|${m.cell}`] ??= { scores: {}, details: {} }); by[`${m.runId}|${m.cell}`].scores[s.item] = s.score; by[`${m.runId}|${m.cell}`].details[s.item] = { reason: s.reason, gap: s.gap }; }
  const rows = flutterCells().map((c) => ({ cell: c.cell, v2: by[`${runId}-v2|${c.cell}`]?.scores ?? {}, v3: by[`${runId}-v3|${c.cell}`]?.scores ?? {} }));
  writeFileSync(join(dest, 'summary.json'), JSON.stringify({ runId, at: new Date().toISOString(), log: r.log, rows, details: by }, null, 2));
  const failed = r.log.filter((b) => !b.ok).length;
  console.log(`judge v2: ${r.log.length - failed}/${r.log.length} batches ok`);
  const auto = existsSync(join(priv, 'automated-v3.json')) ? JSON.parse(readFileSync(join(priv, 'automated-v3.json'), 'utf8')).rows : [];
  const md = [
    `# Flutter harness v3: baseline Flutter cells, old and new capture (run \`${runId}\`)`,
    '',
    'Harness v2 drew every elevation shadow as a solid black outline (flutter_test keeps `debugDisableShadows` on). Harness v3 (`harness/flutter/capture_test.dart`) paints real shadows; v2 stays in `capture_test.v2.dart` to reproduce the old numbers. The recorded code of the 9 baseline Flutter cells was captured again with v3 (no cell was run again). The 9 v2 and 9 v3 screenshot sets were anonymized together and scored in ONE fresh judge v2 session (frozen rubric v2, anchors, prompt), so both face the same judge. Items: ' + ITEMS.join(', ') + '.',
    '',
    '## Means (9 Flutter cells)',
    '',
    `| capture | ${ITEMS.join(' | ')} |`,
    `|---|${ITEMS.map(() => '---').join('|')}|`,
    ...['v2', 'v3'].map((h) => `| harness ${h} | ${ITEMS.map((it) => mean(rows.map((x) => x[h][it]))?.toFixed(2) ?? '—').join(' | ')} |`),
    '',
    '## Per cell (v2 → v3)',
    '',
    `| cell | ${ITEMS.join(' | ')} |`,
    `|---|${ITEMS.map(() => '---').join('|')}|`,
    ...rows.map((x) => `| ${x.cell} | ${ITEMS.map((it) => `${x.v2[it] ?? '—'} → ${x.v3[it] ?? '—'}`).join(' | ')} |`),
    '',
    ...(auto.length ? [
      '## Automated items v2 (same code, v2 → v3 capture)',
      '',
      '| cell | token-fidelity | contrast-targets | anti-patterns | icon-source |',
      '|---|---|---|---|---|',
      ...auto.map((x) => `| ${x.cell} | ${['token-fidelity', 'contrast-targets', 'anti-patterns', 'icon-source'].map((k) => `${x.v2[k]} → ${x.v3[k]}`).join(' | ')} |`),
      '',
    ] : []),
  ].join('\n');
  if (out) {
    mkdirSync(join(root, out), { recursive: true });
    writeFileSync(join(root, out, 'flutter-harness-v3.md'), md);
    writeFileSync(join(root, out, 'flutter-harness-v3.json'), `${JSON.stringify({ runId, rows, automated: auto }, null, 2)}\n`);
    console.log(`wrote ${out}/flutter-harness-v3.md`);
  }
  if (failed) process.exitCode = 3;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd] = process.argv.slice(2);
  const runId = arg('--run-id');
  if (!runId || !['capture', 'judge'].includes(cmd)) { console.error('usage: harness-v3.mjs capture|judge --run-id <id> [--out <public folder>]'); process.exit(2); }
  if (cmd === 'capture') await capture(runId); else await judge(runId, arg('--out'));
}

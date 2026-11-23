#!/usr/bin/env node
// Phase 4 judging (owner decision 2, 2026-11-23): every output is scored in THREE independent blind judge
// v2 sessions (fresh anonymization, new IDs and an own shuffle each, fresh isolated judge processes); per
// output and item the score of record is the MEDIAN of the three. Outputs from several recorded runs
// (baseline, final, rounds, hold-out, Sonnet) are pooled into the same sessions. The mappings are read
// only after every session has finished.
//   node evals/tools/pooled3.mjs --id <pool-id> [--out evals/runs/<folder>] [--sessions 3] [--parallel]
//        --run <runId>:<condition>[:<cell,cell,...>] [--run ...]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allCells } from './cells.mjs';
import { ITEMS } from './judge.mjs';
import { cellTarget } from './pairing.mjs';
import { judgeRequest } from './pipeline.mjs';
import { parseRunSpecs } from './pooled-judge.mjs';
import { judgeV2 } from './rejudge.mjs';

// Shots of record for one recorded cell: the harness version of record first. Baseline Flutter cells
// were re-captured with harness v3 (<cell>/v3), baseline Compose cells with Compose harness v3
// (<cell>/compose-v3); later runs capture with v3 directly (<cell>/).
export const SHOT_DIRS = ['v3', 'compose-v3', 'v2', ''];
export function shotsOfRecord(priv, cellId) {
  for (const sub of SHOT_DIRS) {
    const dir = sub ? join(priv, cellId, sub) : join(priv, cellId);
    const cap = join(dir, 'capture.json');
    if (!existsSync(cap)) continue;
    const shots = (JSON.parse(readFileSync(cap, 'utf8')).shots ?? [])
      .map((s) => ({ ...s, file: join(dir, 'shots', basename(String(s.file).replace(/\\/g, '/'))) }))
      .filter((s) => existsSync(s.file));
    return { harness: sub || 'run', shots };
  }
  return { harness: null, shots: [] };
}

export function median(xs) {
  const v = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

const mean = (xs) => { const v = xs.filter((x) => typeof x === 'number'); return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null; };

// sessions: [{ mapping: {id: {cell, condition, repeat, runId}}, scores: [{id, item, score}] }] ->
// rows [{ key, runId, condition, repeat, cell, sessions: {item: [s1, s2, s3]}, median: {item: m} }].
export function combineSessions(outputs, sessions) {
  const keyOf = (o) => `${o.runId}|${o.cell}|${o.condition}|${o.repeat}`;
  const rows = new Map(outputs.map((o) => [keyOf(o), { key: keyOf(o), runId: o.runId, condition: o.condition, repeat: o.repeat, cell: o.cell,
    sessions: Object.fromEntries(ITEMS.map((it) => [it, sessions.map(() => null)])), median: {} }]));
  sessions.forEach((s, k) => {
    for (const sc of s.scores) {
      const m = s.mapping[sc.id];
      const row = m && rows.get(keyOf(m));
      if (row && ITEMS.includes(sc.item)) row.sessions[sc.item][k] = sc.score;
    }
  });
  for (const row of rows.values()) for (const it of ITEMS) row.median[it] = median(row.sessions[it]);
  return [...rows.values()];
}

export function renderPooled3(id, rows, { sessions, platformOf }) {
  const groups = [...new Set(rows.map((r) => `${r.runId} (${r.condition})`))];
  const fmt = (x) => (x === null || x === undefined ? '—' : Number.isInteger(x) ? String(x) : x.toFixed(2));
  const meansRow = (label, rs) => `| ${label} | ${rs.length} | ${ITEMS.map((it) => fmt(mean(rs.map((r) => r.median[it])))).join(' | ')} |`;
  const head = (first) => [`| ${first} | n | ${ITEMS.join(' | ')} |`, `|---|---|${ITEMS.map(() => '---').join('|')}|`];
  const platforms = [...new Set(rows.map((r) => platformOf(r.cell)))];
  return [
    `# Pooled blind judging, three sessions (judge v2): \`${id}\``,
    '',
    `All outputs below were anonymized together and scored in ${sessions} independent judge v2 sessions (fresh IDs and shuffle each; frozen rubric v2, anchors and prompt). Per output and item the score of record is the median of the sessions (owner decision 2, 2026-11-23). Items: ${ITEMS.join(', ')}.`,
    '',
    '## Means of the medians per run',
    '',
    ...head('run'),
    ...groups.map((g) => meansRow(g, rows.filter((r) => `${r.runId} (${r.condition})` === g))),
    '',
    '## Means of the medians per run and platform',
    '',
    ...head('run / platform'),
    ...groups.flatMap((g) => platforms.map((p) => [g, p, rows.filter((r) => `${r.runId} (${r.condition})` === g && platformOf(r.cell) === p)]).filter(([, , rs]) => rs.length)
      .map(([g, p, rs]) => meansRow(`${g} / ${p}`, rs))),
    '',
    '## Per output: median (session scores)',
    '',
    `| run | cell | ${ITEMS.join(' | ')} |`,
    `|---|---|${ITEMS.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.runId} (${r.condition}) | ${r.cell} | ${ITEMS.map((it) => `${fmt(r.median[it])} (${r.sessions[it].map((x) => x ?? '—').join('/')})`).join(' | ')} |`),
    '',
  ].join('\n');
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const id = arg('--id');
  const out = arg('--out');
  const n = Number(arg('--sessions') ?? 3);
  const specs = parseRunSpecs(process.argv);
  if (!id || !/^[A-Za-z0-9._-]+$/.test(id) || !specs.length || !(n >= 1)) {
    console.error('usage: pooled3.mjs --id <pool-id> [--out <public folder>] [--sessions 3] [--parallel] --run <runId>:<condition>[:<cells>] ...');
    process.exit(2);
  }
  const cells = allCells();
  const byId = Object.fromEntries(cells.map((c) => [c.cell, c]));
  const outputs = [];
  for (const s of specs) {
    const priv = join(root, 'private', 'evals', 'runs', s.runId);
    for (const cell of cells.filter((c) => (s.cells ? s.cells.includes(c.cell) : existsSync(join(priv, c.cell))))) {
      const { shots, harness } = shotsOfRecord(priv, cell.cell);
      if (!shots.length) { console.log(`no shots: ${s.runId} ${cell.cell}`); continue; }
      outputs.push({ cell: cell.cell, condition: s.condition, repeat: 1, runId: s.runId, harness, request: judgeRequest(cell, root), shots, target: cellTarget(cell) });
    }
  }
  console.log(`pooled ${outputs.length} outputs from ${specs.length} runs, ${n} sessions`);
  const dest = join(root, 'private', 'evals', 'runs', `pooled3-${id}`);
  mkdirSync(dest, { recursive: true });
  const { probeBuiltIns } = await import('./isolation.mjs');
  const builtIns = probeBuiltIns();
  const stamp = Date.now();
  const one = (k) => judgeV2({ root, outputs, judgeDir: join('C:\\m3-eval', 'judge-in', `pooled3-${id}-${stamp}-s${k}`),
    mappingPath: join(dest, `mapping-s${k}.json`), batchPrefix: `pooled3-${id}-${stamp}-s${k}`, builtIns });
  const results = [];
  if (process.argv.includes('--parallel')) results.push(...await Promise.all(Array.from({ length: n }, (_, k) => one(k + 1))));
  else for (let k = 1; k <= n; k++) results.push(await one(k));
  // Un-blind only now that every session is scored.
  const sessions = results.map((r, k) => ({ mapping: JSON.parse(readFileSync(join(dest, `mapping-s${k + 1}.json`), 'utf8')), scores: r.scores }));
  const rows = combineSessions(outputs, sessions);
  const reasons = {};
  results.forEach((r, k) => { for (const sc of r.scores) { const m = sessions[k].mapping[sc.id]; if (m) (reasons[`${m.runId}|${m.cell}`] ??= []).push({ session: k + 1, item: sc.item, score: sc.score, reason: sc.reason, gap: sc.gap }); } });
  const failed = results.flatMap((r, k) => r.log.filter((b) => !b.ok).map((b) => ({ session: k + 1, batch: b.batch })));
  writeFileSync(join(dest, 'summary.json'), JSON.stringify({ id, judge: 'v2', sessions: n, at: new Date().toISOString(), failed,
    outputs: outputs.map(({ shots, request, target, ...o }) => o), rows, reasons, logs: results.map((r) => r.log) }, null, 2));
  console.log(`judge v2: ${n} sessions, ${failed.length} failed batches`);
  if (out) {
    mkdirSync(join(root, out), { recursive: true });
    writeFileSync(join(root, out, 'judge-v2-median3.json'), `${JSON.stringify({ id, sessions: n, failed, rows: rows.map(({ key, ...x }) => x) }, null, 2)}\n`);
    writeFileSync(join(root, out, 'judge-v2-median3.md'), renderPooled3(id, rows, { sessions: n, platformOf: (c) => byId[c]?.platform ?? '?' }));
    console.log(`wrote ${out}/judge-v2-median3.json and .md`);
  }
  if (failed.length) process.exitCode = 3;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

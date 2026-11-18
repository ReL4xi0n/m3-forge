#!/usr/bin/env node
// Pooled blind judging (judge v2) of outputs from several recorded runs in ONE fresh judge session, so
// conditions (with-skill rounds, baseline mode) are scored side by side under the same frozen rubric,
// anchors and prompt. Each output is anonymized; the run and condition live only in the mapping, which
// is read after every batch is scored. No cell is run again.
//   node evals/tools/pooled-judge.mjs --id <pool-id> --out evals/runs/<folder>
//        --run <runId>:<condition>[:<cell,cell,...>] [--run ...]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { devCells } from './cells.mjs';
import { ITEMS } from './judge.mjs';
import { cellTarget } from './pairing.mjs';
import { judgeRequest } from './pipeline.mjs';
import { judgeV2, shotsOf } from './rejudge.mjs';

// '--run' values → [{ runId, condition, cells: string[] | null }].
export function parseRunSpecs(argv) {
  return argv.flatMap((a, i) => (a === '--run' ? [argv[i + 1]] : [])).map((v) => {
    const [runId, condition, cells] = String(v).split(':');
    if (!runId || !condition) throw new Error(`--run needs <runId>:<condition>[:<cells>], got ${v}`);
    return { runId, condition, cells: cells ? cells.split(',') : null };
  });
}

const mean = (xs) => { const v = xs.filter((x) => typeof x === 'number'); return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null; };

export function renderPooled(id, rows) {
  const groups = [...new Set(rows.map((r) => `${r.runId} (${r.condition})`))];
  const lines = [
    `# Pooled blind judging (judge v2): \`${id}\``,
    '',
    'All outputs below were anonymized together and scored in one fresh judge v2 session (frozen rubric v2, anchors and prompt), so the runs are compared under the same judge. Items: ' + ITEMS.join(', ') + '.',
    '',
    '## Means per run',
    '',
    `| run | n | ${ITEMS.join(' | ')} |`,
    `|---|---|${ITEMS.map(() => '---').join('|')}|`,
    ...groups.map((g) => { const rs = rows.filter((r) => `${r.runId} (${r.condition})` === g); return `| ${g} | ${rs.length} | ${ITEMS.map((it) => mean(rs.map((r) => r.scores[it]))?.toFixed(2) ?? '—').join(' | ')} |`; }),
    '',
    '## Per output',
    '',
    `| run | cell | ${ITEMS.join(' | ')} |`,
    `|---|---|${ITEMS.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.runId} (${r.condition}) | ${r.cell} | ${ITEMS.map((it) => r.scores[it] ?? '—').join(' | ')} |`),
    '',
  ];
  return lines.join('\n');
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const id = arg('--id');
  const out = arg('--out');
  const specs = parseRunSpecs(process.argv);
  if (!id || !specs.length) { console.error('usage: pooled-judge.mjs --id <pool-id> [--out <public folder>] --run <runId>:<condition>[:<cells>] ...'); process.exit(2); }
  const outputs = [];
  for (const s of specs) {
    const priv = join(root, 'private', 'evals', 'runs', s.runId);
    for (const cell of devCells().filter((c) => !s.cells || s.cells.includes(c.cell))) {
      const shots = shotsOf(priv, cell.cell).shots;
      if (!shots.length) continue;
      outputs.push({ cell: cell.cell, condition: s.condition, repeat: 1, runId: s.runId, request: judgeRequest(cell, root), shots, target: cellTarget(cell) });
    }
  }
  console.log(`pooled ${outputs.length} outputs from ${specs.length} runs`);
  const stamp = Date.now();
  const dest = join(root, 'private', 'evals', 'runs', `pooled-${id}`);
  mkdirSync(dest, { recursive: true });
  const { probeBuiltIns } = await import('./isolation.mjs');
  const r = await judgeV2({ root, outputs, judgeDir: join('C:\\m3-eval', 'judge-in', `pooled-${id}-${stamp}`), mappingPath: join(dest, 'mapping.json'), batchPrefix: `pooled-${id}-${stamp}`, builtIns: probeBuiltIns() });
  const mapping = JSON.parse(readFileSync(join(dest, 'mapping.json'), 'utf8'));
  const byKey = {};
  for (const s of r.scores) { const m = mapping[s.id]; (byKey[`${m.runId}|${m.cell}`] ??= { runId: m.runId, condition: m.condition, cell: m.cell, scores: {}, details: {} }); byKey[`${m.runId}|${m.cell}`].scores[s.item] = s.score; byKey[`${m.runId}|${m.cell}`].details[s.item] = { reason: s.reason, gap: s.gap }; }
  const rows = outputs.map((o) => byKey[`${o.runId}|${o.cell}`] ?? { runId: o.runId, condition: o.condition, cell: o.cell, scores: {}, details: {} });
  writeFileSync(join(dest, 'summary.json'), JSON.stringify({ id, judge: 'v2', at: new Date().toISOString(), log: r.log, pairs: r.pairs, rows }, null, 2));
  const failed = r.log.filter((b) => !b.ok).length;
  console.log(`judge v2: ${r.log.length - failed}/${r.log.length} batches ok`);
  if (out) {
    mkdirSync(join(root, out), { recursive: true });
    writeFileSync(join(root, out, 'judge-v2.json'), `${JSON.stringify({ id, rows: rows.map(({ details, ...x }) => x) }, null, 2)}\n`);
    writeFileSync(join(root, out, 'judge-v2.md'), renderPooled(id, rows));
    console.log(`wrote ${out}/judge-v2.json and judge-v2.md`);
  }
  if (failed) process.exitCode = 3;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

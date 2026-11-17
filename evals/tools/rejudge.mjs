#!/usr/bin/env node
// Blind re-judging of a finished run with judge v2 (protocol change PC-2, owner decision 2026-11-17):
// fresh anonymization of every output, side-by-side anchor pairs, fresh isolated judge sessions,
// un-blinding only after every batch is scored. Flutter and Compose outputs use their harness v2
// screenshots (<cell>/v2/) when recorded; web outputs keep their recorded screenshots (the web
// harness did not change). The run's v1 judging is not touched.
//   node evals/tools/rejudge.mjs --run-id <id> [--out evals/runs/<folder>]
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { anonymize, stripPng } from './anonymize.mjs';
import { splitReferences, parseRefName } from './calibrate.mjs';
import { checkFrozen } from './frozen.mjs';
import { ITEMS, runJudgeBatch } from './judge.mjs';
import { cellTarget, pairAnchors } from './pairing.mjs';
import { judgeRequest } from './pipeline.mjs';

const round = (x, n = 2) => (x === null ? null : Math.round(x * 10 ** n) / 10 ** n);
const mean = xs => { const v = xs.filter(x => typeof x === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

// Recorded screenshots of one cell: harness v2 when present, else the run's own.
export function shotsOf(priv, cellId) {
  for (const dir of [join(priv, cellId, 'v2'), join(priv, cellId)]) {
    const cap = join(dir, 'capture.json');
    if (!existsSync(cap)) continue;
    const shots = (JSON.parse(readFileSync(cap, 'utf8')).shots ?? [])
      .map(s => ({ ...s, file: join(dir, 'shots', basename(String(s.file).replace(/\\/g, '/'))) }))
      .filter(s => existsSync(s.file));
    return { harness: dir.endsWith('v2') ? 'v2' : 'v1', shots };
  }
  return { harness: null, shots: [] };
}

// Judges outputs [{cell, condition, repeat, runId, request, shots, target}] with judge v2.
export async function judgeV2({ root, outputs, judgeDir, mappingPath, batchPrefix, builtIns }) {
  const frozen = checkFrozen(root, 'v2');
  if (!frozen.ok) throw new Error(`judge v2 is not frozen: ${frozen.problems.join('; ')}`);
  const { ids } = anonymize({ outputs, judgeDir, mappingPath });
  const refDir = join(root, 'private', 'reference-screenshots');
  const { anchors } = splitReferences(readdirSync(refDir));
  const hashes = anchors.map(n => createHash('sha256').update(readFileSync(join(refDir, n))).digest('hex'));
  if (JSON.stringify(hashes) !== JSON.stringify(frozen.frozen.anchorSet)) throw new Error('anchor images differ from the frozen v2 anchor set');
  mkdirSync(join(judgeDir, 'anchors'), { recursive: true });
  const list = anchors.map((n, i) => {
    const r = parseRefName(n);
    writeFileSync(join(judgeDir, 'anchors', `a${i + 1}.png`), stripPng(readFileSync(join(refDir, n))));
    return { file: `anchors/a${i + 1}.png`, platform: { android: 'Android', web: 'desktop web', webmobile: 'mobile web' }[r.platform], screen: r.screen, theme: r.theme, style: 'current first-party style', score: 3 };
  });
  writeFileSync(join(judgeDir, 'anchors', 'anchors.json'), JSON.stringify(list, null, 2));
  const mapping = JSON.parse(readFileSync(mappingPath, 'utf8'));
  const byCell = Object.fromEntries(outputs.map(o => [`${o.cell}|${o.condition}|${o.repeat}|${o.runId}`, o]));
  const named = anchors.map((n, i) => ({ name: n, file: list[i].file }));
  const pairs = Object.fromEntries(ids.map(id => {
    const m = mapping[id];
    return [id, pairAnchors(byCell[`${m.cell}|${m.condition}|${m.repeat}|${m.runId}`].target, named)];
  }));
  writeFileSync(join(judgeDir, 'pairs.json'), JSON.stringify(pairs, null, 2));
  const scores = [];
  const log = [];
  for (let i = 0; i < ids.length; i += 12) {
    const batch = ids.slice(i, i + 12);
    const r = await runJudgeBatch({ judgeDir, ids: batch, root, batchId: `${batchPrefix}-${i / 12 + 1}`, builtIns, version: 'v2' });
    log.push({ batch: i / 12 + 1, ok: r.ok, attempts: r.attempts, log: r.log });
    console.log(new Date().toISOString().slice(11, 19), 'judge v2 batch', i / 12 + 1, r.ok ? 'ok' : 'FAILED', 'attempts', r.attempts);
    if (r.ok) scores.push(...r.scores);
  }
  return { ids, scores, log, pairs };
}

// rows: [{cell, platform, v1: {item: score}, v2: {item: score}}]
export function compareJudged(rows) {
  const platforms = [...new Set(rows.map(r => r.platform))];
  const means = (rs, key) => Object.fromEntries(ITEMS.map(it => [it, round(mean(rs.map(r => r[key]?.[it])))]));
  const group = rs => ({ v1: means(rs, 'v1'), v2: means(rs, 'v2'), threes: { v1: rs.flatMap(r => ITEMS.map(it => r.v1?.[it])).filter(s => s === 3).length, v2: rs.flatMap(r => ITEMS.map(it => r.v2?.[it])).filter(s => s === 3).length, of: rs.length * ITEMS.length } });
  return { byPlatform: Object.fromEntries(platforms.map(p => [p, group(rows.filter(r => r.platform === p))])), overall: group(rows) };
}

const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
const fmt = x => (x === null || x === undefined ? '—' : typeof x === 'number' ? x.toFixed(2) : String(x));

export function renderJudgeComparison(runId, rows, notes = []) {
  const c = compareJudged(rows);
  const groups = [...Object.keys(c.byPlatform), 'all'];
  const g = k => (k === 'all' ? c.overall : c.byPlatform[k]);
  return [
    `# Judged items: judge v1 and judge v2 (run \`${runId}\`)`,
    '',
    'judge v1 / rubric v1 is the judging of record published in summary.md. judge v2 / rubric v2 (`evals/rubric-v2.md`, `evals/judge-v2.md`, frozen in `evals/frozen-v2.json` after its own calibration) judged the same recorded outputs blind, side by side with paired first-party references. Flutter and Compose outputs were shown with their harness v2 screenshots; web outputs with the recorded ones. No cell was run again.',
    ...(notes.length ? ['', ...notes.map(n => `- ${n}`)] : []),
    '',
    '## Means by platform',
    '',
    table(['item', ...groups.flatMap(p => [`${p} v1`, `${p} v2`])], ITEMS.map(it => [it, ...groups.flatMap(p => [fmt(g(p).v1[it]), fmt(g(p).v2[it])])])),
    '',
    `Scores of 3: v1 ${c.overall.threes.v1} of ${c.overall.threes.of}, v2 ${c.overall.threes.v2} of ${c.overall.threes.of}.`,
    '',
    '## Per cell (v1 → v2)',
    '',
    table(['cell', ...ITEMS], rows.map(r => [r.cell, ...ITEMS.map(it => `${r.v1?.[it] ?? '—'} → ${r.v2?.[it] ?? '—'}`)])),
    '',
  ].join('\n');
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const runId = arg('--run-id');
  const out = arg('--out');
  if (!runId) { console.error('usage: rejudge.mjs --run-id <id> [--out <public folder>] [--note <text>]...'); process.exit(2); }
  const priv = join(root, 'private', 'evals', 'runs', runId);
  const cells = JSON.parse(readFileSync(join(root, 'evals', 'cells.json'), 'utf8'));
  const outputs = [];
  const harness = {};
  for (const cell of cells) {
    const s = shotsOf(priv, cell.cell);
    harness[cell.cell] = s.harness;
    if (!s.shots.length) continue;
    outputs.push({ cell: cell.cell, condition: 'baseline', repeat: 1, runId, request: judgeRequest(cell, root), shots: s.shots, target: cellTarget(cell) });
  }
  const stamp = Date.now();
  const dest = join(priv, 'judge-v2');
  mkdirSync(dest, { recursive: true });
  const { probeBuiltIns } = await import('./isolation.mjs');
  const r = await judgeV2({ root, outputs, judgeDir: join('C:\\m3-eval', 'judge-in', `${runId}-v2-${stamp}`), mappingPath: join(dest, 'mapping.json'), batchPrefix: `${runId}-v2-${stamp}`, builtIns: probeBuiltIns() });
  // Un-blind only now that every batch is scored.
  const mapping = JSON.parse(readFileSync(join(dest, 'mapping.json'), 'utf8'));
  const byCell = {};
  for (const s of r.scores) (byCell[mapping[s.id].cell] ??= {})[s.item] = { score: s.score, gap: s.gap, reason: s.reason };
  const v1 = JSON.parse(readFileSync(join(priv, 'summary.json'), 'utf8')).summary;
  const rows = cells.map(cell => ({
    cell: cell.cell, platform: cell.platform, harness: harness[cell.cell],
    v1: v1.find(x => x.cell === cell.cell)?.judged ?? null,
    v2: Object.fromEntries(ITEMS.map(it => [it, byCell[cell.cell]?.[it]?.score ?? (outputs.some(o => o.cell === cell.cell) ? null : 0)])),
  }));
  writeFileSync(join(dest, 'summary.json'), JSON.stringify({ runId, judge: 'v2', at: new Date().toISOString(), log: r.log, pairs: r.pairs, rows, details: byCell }, null, 2));
  const failed = r.log.filter(b => !b.ok).length;
  console.log(`judge v2: ${r.log.length - failed}/${r.log.length} batches ok`);
  if (out) {
    const notes = process.argv.flatMap((a, i) => (a === '--note' ? [process.argv[i + 1]] : []));
    mkdirSync(join(root, out), { recursive: true });
    writeFileSync(join(root, out, 'judge-v2.json'), `${JSON.stringify({ runId, ...compareJudged(rows), cells: rows }, null, 2)}\n`);
    writeFileSync(join(root, out, 'judge-v2.md'), renderJudgeComparison(runId, rows, notes));
    console.log(`wrote ${out}/judge-v2.json and judge-v2.md`);
  }
  if (failed) process.exitCode = 3;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

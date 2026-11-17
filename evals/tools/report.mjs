#!/usr/bin/env node
// Public summary of a finished run (plan Task 13 Step 3): scores.json and summary.md.
// Judge reasons and anything else private stay in private/evals/runs/<runId>/summary.json.
//   node evals/tools/report.mjs --run-id <id> --out evals/runs/<date>-baseline [--title <text>]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const round = (x, n = 2) => (x === null ? null : Math.round(x * 10 ** n) / 10 ** n);
const mean = xs => { const v = xs.filter(x => typeof x === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

function itemsOf(rows) {
  const out = [];
  for (const r of rows) for (const k of [...Object.keys(r.automated ?? {}), ...Object.keys(r.judged ?? {})]) if (!out.includes(k)) out.push(k);
  return out;
}
const scoreOf = (r, item) => r.automated?.[item] ?? r.judged?.[item] ?? null;

export function buildScores(run, cells) {
  const axes = Object.fromEntries(cells.map(c => [c.cell, c]));
  const rows = run.summary;
  const items = itemsOf(rows);
  const platforms = [...new Set(rows.map(r => axes[r.cell]?.platform))];
  const meansFor = rs => Object.fromEntries(items.map(it => [it, round(mean(rs.map(r => scoreOf(r, it))))]));
  return {
    runId: run.runId,
    note: 'costUsd is the Claude Code client estimate at API list price for a subscription OAuth session, not a bill.',
    totals: {
      cells: rows.length,
      minutes: round(rows.reduce((a, r) => a + (r.durationMs ?? 0), 0) / 60000, 1),
      captureMinutes: round(rows.reduce((a, r) => a + (r.captureMs ?? 0), 0) / 60000, 1),
      costUsd: round(rows.reduce((a, r) => a + (r.costUsd ?? 0), 0)),
    },
    overall: meansFor(rows),
    byPlatform: Object.fromEntries(platforms.map(p => [p, meansFor(rows.filter(r => axes[r.cell]?.platform === p))])),
    cells: rows.map(r => ({
      cell: r.cell, request: axes[r.cell]?.request, platform: axes[r.cell]?.platform, fixture: axes[r.cell]?.fixture, variant: axes[r.cell]?.variant,
      status: r.status, buildOk: r.buildOk, shots: r.shots, recaptured: r.recaptured ?? false,
      durationMin: r.durationMs ? round(r.durationMs / 60000, 1) : null, costUsd: r.costUsd ?? null,
      uiLines: r.uiLines, violations: r.violations, automated: r.automated, judged: r.judged, isolation: r.isolation,
    })),
  };
}

// Failure types with frequency and example cells: verify violation kinds, judged items at 0 or 1, and
// cells whose build or capture failed. Sorted by the number of cells, most frequent first.
export function failureCatalogue(run, cells, { examples = 3 } = {}) {
  const out = [];
  const add = (type, cell, n = 1) => { const e = out.find(x => x.type === type) ?? (out.push({ type, cells: 0, instances: 0, all: [] }), out.at(-1)); e.cells++; e.instances += n; e.all.push(cell); };
  for (const r of run.summary) {
    for (const [k, n] of Object.entries(r.violations ?? {})) if (n > 0) add(`verify: ${k}`, r.cell, n);
    for (const [k, s] of Object.entries(r.judged ?? {})) if (typeof s === 'number' && s <= 1) add(`judged ≤1: ${k}`, r.cell);
    if (!r.buildOk) add('build/capture failed', r.cell);
  }
  return out.sort((a, b) => b.cells - a.cells || a.type.localeCompare(b.type)).map(({ all, ...e }) => ({ ...e, examples: all.slice(0, examples) }));
}

const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
const fmt = x => (x === null || x === undefined ? '—' : typeof x === 'number' ? x.toFixed(2) : String(x));

export function renderSummary(run, cells, { title = `Run ${run.runId}`, notes = [] } = {}) {
  const s = buildScores(run, cells);
  const platforms = Object.keys(s.byPlatform);
  const items = Object.keys(s.overall);
  const kinds = [...new Set(run.summary.flatMap(r => Object.keys(r.violations ?? {})))];
  const cat = failureCatalogue(run, cells);
  const iso = run.summary.map(r => r.isolation ?? {});
  const all = k => iso.filter(i => i[k] === true).length;
  return [
    `# ${title}`,
    '',
    `Run \`${run.runId}\`: ${s.totals.cells} cells, ${s.totals.minutes} model minutes, ${s.totals.captureMinutes} capture minutes, about $${s.totals.costUsd} (${s.note})`,
    ...(notes.length ? ['', ...notes.map(n => `- ${n}`)] : []),
    '',
    '## Scores by item and platform',
    '',
    'Mean score per item (0–3). Automated items come from verify v1; the others from judge v1. A cell with no screenshots scores 0 on judged items.',
    '',
    table(['item', ...platforms, 'all'], items.map(it => [it, ...platforms.map(p => fmt(s.byPlatform[p][it])), fmt(s.overall[it])])),
    '',
    '### Per cell',
    '',
    table(['cell', ...items, 'build', 'notes'], s.cells.map(c => [c.cell, ...items.map(it => fmt(c.automated?.[it] ?? c.judged?.[it]).replace('.00', '')), c.buildOk ? 'ok' : 'failed', c.recaptured ? 'recaptured' : ''])),
    '',
    '## Automated violation counts',
    '',
    table(['cell', 'ui lines', ...kinds], s.cells.map(c => [c.cell, c.uiLines ?? '—', ...kinds.map(k => c.violations?.[k] ?? '—')])),
    '',
    '## Failure catalogue',
    '',
    'Failure types by the number of cells they occur in. Instances count violations for verify types and cells otherwise.',
    '',
    table(['failure type', 'cells', 'instances', 'example cells'], cat.map(f => [f.type, f.cells, f.instances, f.examples.join(', ')])),
    '',
    '## Isolation',
    '',
    `Canaries: ${(run.canaries ?? []).filter(c => c.pass ?? c.ok).length} of ${(run.canaries ?? []).length} passed. Cell runs: init check ${all('init')}/${iso.length}, transcript audit ${all('audit')}/${iso.length}, preflight ${all('preflight')}/${iso.length}. Warnings are paths outside the work folder (listed privately).`,
    '',
    table(['cell', 'init', 'audit', 'preflight', 'warnings'], s.cells.map(c => [c.cell, c.isolation?.init, c.isolation?.audit, c.isolation?.preflight, c.isolation?.warnings])),
    '',
  ].join('\n');
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const runId = arg('--run-id');
  const out = arg('--out');
  if (!runId || !out) { console.error('usage: --run-id <id> --out <public folder> [--title <text>] [--note <text>]...'); process.exit(2); }
  const priv = join(root, 'private', 'evals', 'runs', runId);
  const run = JSON.parse(readFileSync(join(priv, 'summary.json'), 'utf8'));
  // A --judge-only summary has no canaries; they are in groups.json from the runs.
  if (!run.canaries?.length && existsSync(join(priv, 'groups.json'))) run.canaries = JSON.parse(readFileSync(join(priv, 'groups.json'), 'utf8')).canaries;
  // summary.json does not carry the --recapture mark; record.json does.
  for (const r of run.summary) {
    const rec = join(priv, r.cell, 'record.json');
    if (existsSync(rec)) r.recaptured = Boolean(JSON.parse(readFileSync(rec, 'utf8')).recaptured);
  }
  const cells = JSON.parse(readFileSync(join(root, 'evals', 'cells.json'), 'utf8'));
  const notes = process.argv.flatMap((a, i) => (a === '--note' ? [process.argv[i + 1]] : []));
  mkdirSync(join(root, out), { recursive: true });
  writeFileSync(join(root, out, 'scores.json'), `${JSON.stringify({ ...buildScores(run, cells), failureCatalogue: failureCatalogue(run, cells) }, null, 2)}\n`);
  writeFileSync(join(root, out, 'summary.md'), renderSummary(run, cells, { title: arg('--title') ?? undefined, notes }));
  console.log(`wrote ${out}/scores.json and summary.md`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

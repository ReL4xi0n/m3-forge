#!/usr/bin/env node
// Wording micro-tests for the /material3 skill (writing-skills method): per row, N isolated sessions in
// two arms (skill: `/material3 <task>`, control: the task alone) on a copy of web-empty, each project
// scored with the static verify. Only task prompts are sent; no eval request is ever used.
//   node evals/tools/microtest.mjs --run-id <id> [--reps 5] [--rows F7,F11,F12] [--pilot]
//   node evals/tools/microtest.mjs --run-id <id> --summarize     (rebuild summary.md from saved records)
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const ROWS = {
  F7: { task: 'Build a settings row with a bell icon that toggles notifications.', checks: ['icon-source', 'unknown-icon'], label: 'icon-source + unknown-icon' },
  F11: { task: 'Build a newsletter sign-up form with name and email fields and a short confirmation message.', checks: ['placeholder-content'], label: 'placeholder-content' },
  F12: { task: 'Build a payment method picker with three options and a pay button.', checks: ['brand'], label: 'brand' },
};
export const ARMS = ['skill', 'control'];

export const cellId = (row, arm, k) => `micro.${row}.${arm}.r${k}`;
export const microCell = (row, arm, k) => ({ cell: cellId(row, arm, k), request: `micro-${row}`, platform: 'web', fixture: 'web-empty', variant: 'default', set: 'dev' });
export const promptFor = (row, arm) => arm === 'skill' ? `/material3 ${ROWS[row].task}` : ROWS[row].task;

// The verify violations that count for a row: the scored icon-source plus the unscored checks.
export const rowHits = (row, ver) => (ver?.violations ?? []).filter(v => ROWS[row].checks.includes(v.check));

// Per row x arm aggregate over run records ({ row, arm, hits: [...], costUsd }).
export function aggregate(records) {
  const out = {};
  for (const r of records) {
    const a = (out[`${r.row}|${r.arm}`] ??= { row: r.row, arm: r.arm, runs: 0, runsWithHit: 0, hits: 0, costUsd: 0, failed: 0 });
    a.runs++;
    if (r.status && !['ok', 'asked-question'].includes(r.status)) a.failed++;
    if (r.hits.length) a.runsWithHit++;
    a.hits += r.hits.length;
    a.costUsd += r.costUsd ?? 0;
  }
  return out;
}

const esc = s => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
export function renderSummary({ runId, records, verdicts = {} }) {
  const agg = aggregate(records);
  const total = records.reduce((a, r) => a + (r.costUsd ?? 0), 0);
  const L = [`# Wording micro-tests (${runId})`, '',
    `${records.length} runs, total cost $${total.toFixed(2)}. Hit = verify violation of the row's checks (static). Verdicts were read by hand.`, '',
    '| Row | Checks | Arm | Runs | Runs with hit | Total hits | Cost (USD) | Not ok |', '|---|---|---|---|---|---|---|---|'];
  for (const row of Object.keys(ROWS)) for (const arm of ARMS) {
    const a = agg[`${row}|${arm}`];
    if (a) L.push(`| ${row} | ${ROWS[row].label} | ${arm} | ${a.runs} | ${a.runsWithHit} | ${a.hits} | ${a.costUsd.toFixed(2)} | ${a.failed} |`);
  }
  L.push('', '## Hit lines', '');
  for (const row of Object.keys(ROWS)) for (const arm of ARMS) {
    const rs = records.filter(r => r.row === row && r.arm === arm && r.hits.length);
    L.push(`### ${row} / ${arm}`, '');
    if (!rs.length) { L.push('No hits.', ''); continue; }
    L.push('| Run | Check | Location | Line | Verdict |', '|---|---|---|---|---|');
    for (const r of rs) for (const h of r.hits) {
      const key = `${r.cell}:${h.file}:${h.line}:${h.check}`;
      L.push(`| ${r.cell} | ${h.check} | ${esc(h.file)}:${h.line} | \`${esc(h.source ?? h.detail ?? '').slice(0, 160)}\` | ${verdicts[key] ?? 'unread'} |`);
    }
    L.push('');
  }
  const verdictCounts = {};
  for (const r of records) for (const h of r.hits) {
    const v = verdicts[`${r.cell}:${h.file}:${h.line}:${h.check}`] ?? 'unread';
    const k = `${r.row}|${r.arm}|${v}`;
    verdictCounts[k] = (verdictCounts[k] ?? 0) + 1;
  }
  L.push('## Verdict totals', '', '| Row | Arm | real | false | unread |', '|---|---|---|---|---|');
  for (const row of Object.keys(ROWS)) for (const arm of ARMS) {
    const g = v => verdictCounts[`${row}|${arm}|${v}`] ?? 0;
    L.push(`| ${row} | ${arm} | ${g('real')} | ${g('false')} | ${g('unread')} |`);
  }
  return L.join('\n') + '\n';
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const argv = process.argv.slice(2);
  const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const runId = arg('--run-id');
  if (!runId || !/^[A-Za-z0-9._-]+$/.test(runId)) { console.error('usage: microtest.mjs --run-id <id> [--reps 5] [--rows F7,F11,F12] [--pilot] [--summarize]'); process.exit(2); }
  const priv = join(root, 'private', 'evals', 'runs', runId);
  const outDir = join(root, 'evals', 'runs', 'dev-microtests');
  mkdirSync(priv, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  const verdictsFile = join(outDir, 'verdicts.json');
  const writeSummary = () => {
    const records = readdirSync(priv).filter(d => existsSync(join(priv, d, 'micro.json'))).map(d => JSON.parse(readFileSync(join(priv, d, 'micro.json'), 'utf8')))
      .sort((a, b) => a.cell.localeCompare(b.cell, 'en', { numeric: true }));
    const verdicts = existsSync(verdictsFile) ? JSON.parse(readFileSync(verdictsFile, 'utf8')) : {};
    writeFileSync(join(outDir, 'summary.md'), renderSummary({ runId, records, verdicts }));
    return records;
  };
  if (argv.includes('--summarize')) { writeSummary(); return; }

  const reps = Number(arg('--reps', 5));
  const rows = (arg('--rows') ?? Object.keys(ROWS).join(',')).split(',').filter(r => ROWS[r]);
  const skillDir = join(root, 'plugin', 'skills', 'material3');
  const { runCell } = await import('./run-cell.mjs');
  const { prepareFixture } = await import('./prepare-fixture.mjs');
  const { probeBuiltIns } = await import('./isolation.mjs');
  const { canaryPassed, latestCanary } = await import('./pipeline.mjs');
  const { verify } = await import('../../plugin/skills/material3/scripts/verify/index.mjs');
  const runsDir = join(root, 'private', 'evals', 'runs');
  const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

  const canary = skill => {
    const before = latestCanary(readdirSync(runsDir), { skill });
    const c = spawnSync(process.execPath, [join(root, 'evals', 'tools', 'canary.mjs'), ...(skill ? ['--skill'] : [])], { cwd: root, encoding: 'utf8', windowsHide: true });
    const latest = latestCanary(readdirSync(runsDir), { skill });
    let v = null;
    try { v = JSON.parse(readFileSync(join(runsDir, latest ?? '', 'verdict.json'), 'utf8')); } catch { /* not passed */ }
    const pass = canaryPassed({ exit: c.status, before, after: latest, verdict: v });
    log(skill ? 'skill canary' : 'baseline canary', latest, pass ? 'pass' : 'FAIL');
    return pass ? v : null;
  };
  const base = canary(false);
  const skillV = base && canary(true);
  if (!base || !skillV) { console.error('canary failed; no runs'); process.exit(3); }
  const builtIns = probeBuiltIns();

  const one = async (row, arm, k) => {
    const cell = microCell(row, arm, k);
    const dest = join(priv, cell.cell);
    if (existsSync(join(dest, 'micro.json'))) { log('reuse', cell.cell); return JSON.parse(readFileSync(join(dest, 'micro.json'), 'utf8')); }
    log('run', cell.cell);
    const rec = await runCell({ cell, runId, root, builtIns, allowedSkills: (arm === 'skill' ? skillV : base).allowedSkills,
      skillDir: arm === 'skill' ? skillDir : null, promptOverride: promptFor(row, arm), kind: 'micro',
      prepare: async w => { const r = await prepareFixture(cell.fixture, w); if (!r.ok) throw new Error(`fixture failed:\n${r.log.slice(-2000)}`); } });
    let ver = null;
    if (existsSync(rec.workDir ?? '')) { try { ver = await verify({ projectDir: rec.workDir, platform: 'web' }); } catch (e) { ver = { error: e.message, violations: [] }; } }
    const hits = rowHits(row, ver).map(v => {
      let source = null;
      try { source = readFileSync(join(rec.workDir, v.file), 'utf8').split(/\r?\n/)[v.line - 1]?.trim() ?? null; } catch { /* file gone */ }
      return { check: v.check, file: v.file, line: v.line, detail: v.detail, source };
    });
    const out = { cell: cell.cell, row, arm, rep: k, status: rec.status, costUsd: rec.costUsd, durationMs: rec.durationMs,
      isolation: { init: rec.checks?.init?.ok ?? null, audit: rec.checks?.audit?.ok ?? null }, hits, verifyError: ver?.error ?? null };
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, 'micro.json'), JSON.stringify(out, null, 2));
    writeFileSync(join(dest, 'verify.json'), JSON.stringify(ver, null, 2));
    log('  ', cell.cell, rec.status, `${((rec.durationMs ?? 0) / 60000).toFixed(1)} min`, `$${rec.costUsd}`, 'hits', hits.length);
    return out;
  };

  if (!existsSync(join(priv, cellId(rows[0], 'skill', 1), 'micro.json'))) {
    const p = await one(rows[0], 'skill', 1);
    if ((p.costUsd ?? 0) > 1.5 || (p.durationMs ?? 0) > 15 * 60000) { writeSummary(); console.error(`pilot run over budget ($${p.costUsd}, ${(p.durationMs / 60000).toFixed(1)} min); stopping`); process.exit(4); }
  }
  if (argv.includes('--pilot')) return;
  const jobs = [];
  for (let k = 1; k <= reps; k++) for (const row of rows) for (const arm of ARMS) jobs.push([row, arm, k]);
  let i = 0;
  const worker = async () => { while (i < jobs.length) await one(...jobs[i++]); };
  await Promise.all([worker(), worker()]);
  const records = writeSummary();
  log('done', records.length, 'runs, cost', records.reduce((a, r) => a + (r.costUsd ?? 0), 0).toFixed(2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

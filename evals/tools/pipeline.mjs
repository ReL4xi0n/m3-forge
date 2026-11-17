#!/usr/bin/env node
// Eval pipeline for a set of cells (Phase 2 plan, Tasks 12–13): canary → per cell: isolated run, capture,
// verify → anonymize all outputs → blind judge batches → un-blind. Every cell yields a record.
//   node evals/tools/pipeline.mjs --run-id <id> --cells <cell,cell,...> | --all  [--pair 1|2] [--resume]
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { totalmem, freemem } from 'node:os';
import { buildPrompt } from './run-cell.mjs';

const BANDS = {
  'token-fidelity': { checks: ['hardcoded-color', 'off-token-type', 'off-token-radius'], perLines: true, cut: [0, 1, 5] },
  'contrast-targets': { checks: ['contrast', 'touch-target'], cut: [0, 2, 6] },
  'anti-patterns': { checks: ['shadow-gradient', 'icon-source', 'foreign-styling'], cut: [0, 1, 4] },
};

// Rubric v1 automated items: 3 at the first cut, 2 up to the second, 1 up to the third, else 0.
export function automatedScores(verifyResult, buildOk) {
  const out = {};
  for (const [item, b] of Object.entries(BANDS)) {
    if (!buildOk || !verifyResult) { out[item] = 0; continue; }
    const n = b.checks.reduce((a, c) => a + (verifyResult.counts?.[c] ?? 0), 0);
    const x = b.perLines ? (n * 100) / Math.max(1, verifyResult.uiLines ?? 0) : n;
    out[item] = x <= b.cut[0] ? 3 : x <= b.cut[1] ? 2 : x <= b.cut[2] ? 1 : 0;
  }
  return out;
}

export function judgeRequest(cell, root) {
  return buildPrompt(cell, root).trim()
    .replace(/ The current folder is empty; create the project here\.$/, '')
    .replace(/ The project is in the current folder\.$/, '');
}

// Owner decision (2026-11-17): web and Flutter cells run two at a time, Compose cells one at a time.
// The first Compose cell runs first, so its time, cost and memory are known early.
export function schedule(cells, { pair = 2 } = {}) {
  const compose = cells.filter(c => c.platform === 'compose');
  const rest = cells.filter(c => c.platform !== 'compose');
  const groups = compose.length ? [[compose[0]]] : [];
  for (let i = 0; i < rest.length; i += pair) groups.push(rest.slice(i, i + pair));
  for (const c of compose.slice(1)) groups.push([c]);
  return groups;
}

// The plan's "canary before every batch of 6": a group that would take the count past 6 gets a new one.
export const canaryDue = ({ sinceCanary, next }) => sinceCanary === null || sinceCanary + next > 6;

// Owner rule: if the quota runs out, stop; never try to get around it.
export const isQuotaStop = rec => rec.status === 'session-error' &&
  /usage limit|limit reached|hit your limit|rate.?limit|\b429\b|quota|out of (extra )?usage/i.test(rec.resultText ?? '');

// Samples memory every 5 s while a group runs: system-wide use and the total of java.exe working sets.
function memSampler() {
  const before = totalmem() - freemem();
  let peak = before;
  let javaPeak = 0;
  const tick = () => {
    peak = Math.max(peak, totalmem() - freemem());
    try {
      const out = execFileSync('tasklist', ['/FI', 'IMAGENAME eq java.exe', '/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true });
      const kb = out.split(/\r?\n/).filter(l => l.startsWith('"java')).map(l => Number(l.split('","').pop().replace(/[^0-9]/g, ''))).reduce((a, x) => a + x, 0);
      javaPeak = Math.max(javaPeak, kb * 1024);
    } catch { /* no tasklist: system figure only */ }
  };
  const t = setInterval(tick, 5000);
  const gb = b => +(b / 2 ** 30).toFixed(2);
  return { stop: () => { clearInterval(t); tick(); return { totalGb: gb(totalmem()), usedBeforeGb: gb(before), usedPeakGb: gb(peak), javaPeakGb: gb(javaPeak) }; } };
}

const absShots = (shots, dir) => (shots ?? []).map(s => ({ ...s, file: isAbsolute(s.file) ? s.file : join(dir, s.file) }));

async function capture(cell, projectDir, outDir) {
  if (cell.platform === 'web') return (await import('../../harness/web/capture.mjs')).captureWeb({ projectDir, kind: cell.fixture, outDir });
  if (cell.platform === 'flutter') return (await import('../../harness/flutter/capture.mjs')).captureFlutter({ projectDir, outDir });
  return (await import('../../harness/compose/capture.mjs')).captureCompose({ projectDir, outDir });
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const runId = arg('--run-id');
  const all = JSON.parse(readFileSync(join(root, 'evals', 'cells.json'), 'utf8'));
  const cells = process.argv.includes('--all') ? all : all.filter(c => (arg('--cells') ?? '').split(',').includes(c.cell));
  const pair = Number(arg('--pair') ?? 1);
  if (!runId || !/^[A-Za-z0-9._-]+$/.test(runId) || !cells.length || !(pair === 1 || pair === 2)) {
    console.error('usage: pipeline.mjs --run-id <id> (--cells a,b | --all) [--pair 1|2] [--resume]');
    process.exit(2);
  }
  const { runCell } = await import('./run-cell.mjs');
  const { prepareFixture } = await import('./prepare-fixture.mjs');
  const { probeBuiltIns } = await import('./isolation.mjs');
  const { anonymize } = await import('./anonymize.mjs');
  const { runJudgeBatch, ITEMS } = await import('./judge.mjs');
  const { verify } = await import('../../plugin/skills/material3/scripts/verify/index.mjs');
  const runsDir = join(root, 'private', 'evals', 'runs');
  const priv = join(runsDir, runId);
  mkdirSync(priv, { recursive: true });
  const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

  // A canary (V4) before every batch of 6 cells; its built-in list is the allowlist for those runs.
  let verdict = null;
  const canaries = [];
  const runCanary = () => {
    log('canary');
    const c = spawnSync(process.execPath, [join(root, 'evals', 'tools', 'canary.mjs')], { cwd: root, encoding: 'utf8', windowsHide: true });
    const latest = readdirSync(runsDir).filter(d => d.startsWith('canary-')).sort().pop();
    const f = join(runsDir, latest ?? '', 'verdict.json');
    verdict = latest && existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
    canaries.push({ id: latest, exit: c.status, pass: Boolean(verdict?.pass) });
    log('  canary', latest, verdict?.pass ? 'pass' : 'FAIL');
    return Boolean(verdict?.pass);
  };
  const builtIns = probeBuiltIns();

  const doCell = async cell => {
    const dest = join(priv, cell.cell);
    if (process.argv.includes('--resume') && existsSync(join(dest, 'record.json'))) {
      const saved = JSON.parse(readFileSync(join(dest, 'record.json'), 'utf8'));
      if (!['invalid-isolation', 'session-error'].includes(saved.rec.status)) { log('reuse', cell.cell, saved.rec.status); return saved; }
    }
    log('run', cell.cell);
    const rec = await runCell({ cell, runId, root, builtIns, allowedSkills: verdict.allowedSkills,
      prepare: async w => { const r = await prepareFixture(cell.fixture, w); if (!r.ok) throw new Error(`fixture ${cell.fixture} failed:\n${r.log.slice(-2000)}`); } });
    log('  status', cell.cell, rec.status, 'durationMs', rec.durationMs, 'cost', rec.costUsd);
    let cap = { buildOk: false, reason: `run status ${rec.status}`, shots: [], runtime: { contrast: [], targets: [] } };
    if (['ok', 'secret-redacted', 'asked-question', 'timeout', 'session-error'].includes(rec.status) && !isQuotaStop(rec) && existsSync(rec.workDir ?? '')) {
      const shotDir = join('C:\\m3-eval', 'shots', runId, cell.cell);
      const t0 = Date.now();
      try { cap = await capture(cell, rec.workDir, shotDir); } catch (e) { cap = { ...cap, reason: `capture error: ${e.message}` }; }
      cap.captureMs = Date.now() - t0;
      cap.shots = absShots(cap.shots, shotDir);
      if (existsSync(shotDir)) cpSync(shotDir, join(dest, 'shots'), { recursive: true });
    }
    let ver = null;
    if (existsSync(rec.workDir ?? '')) {
      try { ver = await verify({ projectDir: rec.workDir, platform: cell.platform, runtime: cap.runtime }); } catch (e) { ver = { error: e.message }; }
    }
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, 'verify.json'), JSON.stringify(ver, null, 2));
    writeFileSync(join(dest, 'capture.json'), JSON.stringify({ ...cap, raw: undefined }, null, 2));
    log('  capture', cell.cell, 'buildOk', cap.buildOk, 'shots', cap.shots.length, 'violations', ver?.violations?.length ?? 'n/a');
    const out = { cell, rec, cap: { ...cap, raw: undefined }, ver: ver && { counts: ver.counts, uiLines: ver.uiLines, error: ver.error },
      auto: automatedScores(ver?.error ? null : ver, cap.buildOk && cap.shots.length > 0) };
    writeFileSync(join(dest, 'record.json'), JSON.stringify(out, null, 2));
    return out;
  };

  const records = [];
  const groups = [];
  let sinceCanary = null;
  let stopped = null;
  for (const group of schedule(cells, { pair })) {
    if (canaryDue({ sinceCanary, next: group.length })) {
      if (!runCanary()) { stopped = { reason: 'canary failed', before: group.map(c => c.cell) }; break; }
      sinceCanary = 0;
    }
    const mem = memSampler();
    const t0 = Date.now();
    const recs = await Promise.all(group.map(doCell));
    const g = { cells: group.map(c => c.cell), wallMs: Date.now() - t0, memory: mem.stop(),
      costUsd: +recs.reduce((a, r) => a + (r.rec.costUsd ?? 0), 0).toFixed(4) };
    sinceCanary += group.length;
    records.push(...recs);
    groups.push(g);
    writeFileSync(join(priv, 'groups.json'), JSON.stringify({ canaries, groups }, null, 2));
    log('group done', JSON.stringify(g));
    const q = recs.find(r => isQuotaStop(r.rec));
    if (q) { stopped = { reason: 'quota', cell: q.cell.cell, text: q.rec.resultText }; log('QUOTA: stopping; no further cell starts'); break; }
  }

  // Blind judging over every output of this run; skipped when the run stopped early.
  const outputs = stopped ? [] : records.filter(r => r.cap.shots.length).map(r => ({
    cell: r.cell.cell, condition: 'baseline', repeat: 1, runId, request: judgeRequest(r.cell, root), shots: r.cap.shots }));
  const scores = [];
  const judgeLog = [];
  if (outputs.length) {
    const judgeDir = join('C:\\m3-eval', 'judge-in', runId);
    const mappingPath = join(priv, 'mapping.json');
    const { ids } = anonymize({ outputs, judgeDir, mappingPath });
    const { stripPng } = await import('./anonymize.mjs');
    const { splitReferences, parseRefName } = await import('./calibrate.mjs');
    const refDir = join(root, 'private', 'reference-screenshots');
    const { anchors } = splitReferences(readdirSync(refDir));
    const frozen = JSON.parse(readFileSync(join(root, 'evals', 'frozen.json'), 'utf8'));
    const { createHash } = await import('node:crypto');
    const anchorHashes = anchors.map(n => createHash('sha256').update(readFileSync(join(refDir, n))).digest('hex'));
    if (JSON.stringify(anchorHashes) !== JSON.stringify(frozen.anchorSet)) throw new Error('anchor images differ from the frozen anchor set');
    mkdirSync(join(judgeDir, 'anchors'), { recursive: true });
    const list = anchors.map((n, i) => {
      const r = parseRefName(n);
      writeFileSync(join(judgeDir, 'anchors', `a${i + 1}.png`), stripPng(readFileSync(join(refDir, n))));
      return { file: `anchors/a${i + 1}.png`, platform: { android: 'Android', web: 'desktop web', webmobile: 'mobile web' }[r.platform], screen: r.screen, theme: r.theme, style: 'current first-party style', score: 3 };
    });
    writeFileSync(join(judgeDir, 'anchors', 'anchors.json'), JSON.stringify(list, null, 2));
    for (let i = 0; i < ids.length; i += 12) {
      const batch = ids.slice(i, i + 12);
      const r = await runJudgeBatch({ judgeDir, ids: batch, root, batchId: `${runId}-${i / 12 + 1}`, builtIns });
      judgeLog.push({ batch: i / 12 + 1, ok: r.ok, attempts: r.attempts, log: r.log });
      log('judge batch', i / 12 + 1, r.ok ? 'ok' : 'FAILED', 'attempts', r.attempts);
      if (r.ok) scores.push(...r.scores);
    }
  }
  // Un-blind only now that every batch is scored.
  const mapping = outputs.length ? JSON.parse(readFileSync(join(priv, 'mapping.json'), 'utf8')) : {};
  const byCell = {};
  for (const s of scores) (byCell[mapping[s.id].cell] ??= {})[s.item] = { score: s.score, reason: s.reason };
  const summary = records.map(r => ({
    cell: r.cell.cell, status: r.rec.status, durationMs: r.rec.durationMs, costUsd: r.rec.costUsd, usage: r.rec.usage,
    buildOk: r.cap.buildOk, reason: r.cap.reason ?? null, captureMs: r.cap.captureMs ?? null, shots: r.cap.shots.length,
    violations: r.ver?.counts ?? null, uiLines: r.ver?.uiLines ?? null,
    automated: r.auto,
    judged: Object.fromEntries(ITEMS.map(it => [it, byCell[r.cell.cell]?.[it]?.score ?? (r.cap.shots.length ? null : 0)])),
    reasons: byCell[r.cell.cell] ?? null,
    isolation: { init: r.rec.checks?.init?.ok ?? null, audit: r.rec.checks?.audit?.ok ?? null, preflight: r.rec.checks?.preflight?.ok ?? null, warnings: r.rec.checks?.audit?.hits?.length ?? 0 },
  }));
  writeFileSync(join(priv, 'summary.json'), JSON.stringify({ runId, stopped, canaries, groups, judgeLog, summary }, null, 2));
  console.log(JSON.stringify(summary.map(s => ({ cell: s.cell, status: s.status, min: s.durationMs && +(s.durationMs / 60000).toFixed(1), usd: s.costUsd, buildOk: s.buildOk, automated: s.automated, judged: s.judged })), null, 1));
  if (stopped) { console.error('stopped:', JSON.stringify(stopped)); process.exitCode = 3; }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

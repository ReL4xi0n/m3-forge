#!/usr/bin/env node
// Eval pipeline for a set of cells (Phase 2 plan, Tasks 12–13): canary → per cell: isolated run, capture,
// verify → anonymize all outputs → blind judge batches → un-blind. Every cell yields a record.
//   node evals/tools/pipeline.mjs --run-id <id> --cells <cell,cell,...> | --all
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
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
  if (!runId || !/^[A-Za-z0-9._-]+$/.test(runId) || !cells.length) { console.error('usage: pipeline.mjs --run-id <id> (--cells a,b | --all)'); process.exit(2); }
  const { runCell } = await import('./run-cell.mjs');
  const { prepareFixture } = await import('./prepare-fixture.mjs');
  const { probeBuiltIns } = await import('./isolation.mjs');
  const { anonymize } = await import('./anonymize.mjs');
  const { runJudgeBatch, ITEMS } = await import('./judge.mjs');
  const { verify } = await import('../../plugin/skills/material3/scripts/verify/index.mjs');
  const priv = join(root, 'private', 'evals', 'runs', runId);
  mkdirSync(priv, { recursive: true });
  const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

  // The canary's built-in list is the allowlist for every run of this batch (V4 before the batch).
  const canaries = readdirSync(join(root, 'private', 'evals', 'runs')).filter(d => d.startsWith('canary-')).sort();
  const latest = canaries.reverse().map(d => join(root, 'private', 'evals', 'runs', d, 'verdict.json')).find(f => existsSync(f));
  const verdict = latest ? JSON.parse(readFileSync(latest, 'utf8')) : null;
  if (!verdict?.pass) { console.error('run the canary first (node evals/tools/canary.mjs): no passing verdict'); process.exit(1); }
  const builtIns = probeBuiltIns();
  const records = [];
  for (const cell of cells) {
    log('run', cell.cell);
    const rec = await runCell({ cell, runId, root, builtIns, allowedSkills: verdict.allowedSkills,
      prepare: async w => { const r = await prepareFixture(cell.fixture, w); if (!r.ok) throw new Error(`fixture ${cell.fixture} failed:\n${r.log.slice(-2000)}`); } });
    log('  status', rec.status, 'durationMs', rec.durationMs, 'cost', rec.costUsd);
    const dest = join(priv, cell.cell);
    let cap = { buildOk: false, reason: `run status ${rec.status}`, shots: [], runtime: { contrast: [], targets: [] } };
    if (['ok', 'secret-redacted', 'asked-question', 'timeout', 'session-error'].includes(rec.status) && existsSync(rec.workDir ?? '')) {
      const shotDir = join('C:\\m3-eval', 'shots', runId, cell.cell);
      try { cap = await capture(cell, rec.workDir, shotDir); } catch (e) { cap = { ...cap, reason: `capture error: ${e.message}` }; }
      cap.shots = absShots(cap.shots, shotDir);
      if (existsSync(shotDir)) cpSync(shotDir, join(dest, 'shots'), { recursive: true });
    }
    let ver = null;
    if (existsSync(rec.workDir ?? '')) {
      try { ver = await verify({ projectDir: rec.workDir, platform: cell.platform, runtime: cap.runtime }); } catch (e) { ver = { error: e.message }; }
    }
    writeFileSync(join(dest, 'verify.json'), JSON.stringify(ver, null, 2));
    writeFileSync(join(dest, 'capture.json'), JSON.stringify({ ...cap, raw: undefined }, null, 2));
    log('  capture buildOk', cap.buildOk, 'shots', cap.shots.length, 'violations', ver?.violations?.length ?? 'n/a');
    records.push({ cell, rec, cap, ver, auto: automatedScores(ver?.error ? null : ver, cap.buildOk && cap.shots.length > 0) });
  }

  // Blind judging over every output of this run.
  const outputs = records.filter(r => r.cap.shots.length).map(r => ({
    cell: r.cell.cell, condition: 'baseline', repeat: 1, runId, request: judgeRequest(r.cell, root), shots: r.cap.shots }));
  const scores = [];
  const judgeLog = [];
  if (outputs.length) {
    const judgeDir = join('C:\\m3-eval', 'judge-in', runId);
    const mappingPath = join(priv, 'mapping.json');
    const { ids } = anonymize({ outputs, judgeDir, mappingPath });
    const { stripPng } = await import('./anonymize.mjs');
    const { splitReferences } = await import('./calibrate.mjs');
    const refDir = join(root, 'private', 'reference-screenshots');
    const { anchors } = splitReferences(readdirSync(refDir));
    const frozen = JSON.parse(readFileSync(join(root, 'evals', 'frozen.json'), 'utf8'));
    const { createHash } = await import('node:crypto');
    const anchorHashes = anchors.map(n => createHash('sha256').update(readFileSync(join(refDir, n))).digest('hex'));
    if (JSON.stringify(anchorHashes) !== JSON.stringify(frozen.anchorSet)) throw new Error('anchor images differ from the frozen anchor set');
    mkdirSync(join(judgeDir, 'anchors'), { recursive: true });
    const { parseRefName } = await import('./calibrate.mjs');
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
    buildOk: r.cap.buildOk, reason: r.cap.reason ?? null, shots: r.cap.shots.length, violations: r.ver?.counts ?? null, uiLines: r.ver?.uiLines ?? null,
    automated: r.auto,
    judged: Object.fromEntries(ITEMS.map(it => [it, byCell[r.cell.cell]?.[it]?.score ?? (r.cap.shots.length ? null : 0)])),
    reasons: byCell[r.cell.cell] ?? null,
    isolation: { init: r.rec.checks?.init?.ok ?? null, audit: r.rec.checks?.audit?.ok ?? null, preflight: r.rec.checks?.preflight?.ok ?? null, warnings: r.rec.checks?.audit?.hits?.length ?? 0 },
  }));
  writeFileSync(join(priv, 'summary.json'), JSON.stringify({ runId, judgeLog, summary }, null, 2));
  console.log(JSON.stringify(summary.map(s => ({ cell: s.cell, status: s.status, min: s.durationMs && +(s.durationMs / 60000).toFixed(1), usd: s.costUsd, buildOk: s.buildOk, automated: s.automated, judged: s.judged })), null, 1));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

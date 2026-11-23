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
import { withToolchain, toolchainRoot } from './toolchain-env.mjs';
import { devCells, evalCells } from './cells.mjs';
import { latestCanary } from './canary.mjs';

// Rubric v1 automated items (default) and v2 (evals/automated-v2.md), in evals/tools/automated.mjs.
import { automatedScores } from './automated.mjs';
export { automatedScores };

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

// Owner decision 6 (2026-11-23): available memory a group needs before it starts (GB), the re-check
// interval while it does not hold, and how long Compose may wait before the run stops.
// Relaxed by the owner the same evening (relay, 2026-11-23, replaces decision 6's figures: the machine
// stayed at 1.3-1.9 GB available all evening; Phases 2-3 ran from 1.6-2.9 GB with a 32 GB pagefile):
// web/Flutter cells one at a time from 1.2 GB, Compose alone from 1.5 GB.
export const MEM_THRESHOLD_GB = { compose: 1.5, other: 1.2 };
export const MEM_RECHECK_MS = 10 * 60_000;
export const COMPOSE_WAIT_MS = 3 * 60 * 60_000;
const needGb = g => (g[0].platform === 'compose' ? MEM_THRESHOLD_GB.compose : MEM_THRESHOLD_GB.other);

// The first group in queue order whose threshold holds, or -1. Compose groups keep their place in the
// order; when one does not fit, a later web/Flutter group that fits runs first.
export function pickGroup(queue, availGb) {
  return queue.findIndex(g => availGb >= needGb(g));
}

// A failure caused by memory pressure (owner, relay 2026-11-23): retried once after cleanup, then the
// cell is skipped and reported as "missing because of memory"; never a stop.
export const MEMORY_FAILURE = /OutOfMemory|Java heap space|GC overhead|Metaspace|daemon disappeared|Gradle build daemon .*(crash|stopped|disappeared)|Could not (create|reserve).*(heap|memory)|paging file|insufficient memory|not enough memory|timed? ?out|timeout/i;
export function memoryFailure(r) {
  if (r.rec.status === 'timeout') return true;
  if (r.rec.status !== 'ok' && r.rec.status !== 'secret-redacted') return false;
  return !r.cap.buildOk && MEMORY_FAILURE.test(String(r.cap.reason ?? ''));
}

// Owner decision 3 as amended (relay, 2026-11-23: continue even when cost and time rise): a Phase 4 run
// stops only on a systematic fault that memory does not explain: two or more cells that failed isolation
// or the freeze check, or that did not build for a reason other than memory. Cells over twice the
// measured cost range are reported, not stopped on.
export const COST_LIMIT_USD = { web: 2 * 3.47, flutter: 2 * 3.10, compose: 2 * 3.63 };
export function phase4Stop(records) {
  const faults = records.filter(r => !r.memorySkipped && !memoryFailure(r) &&
    (['invalid-isolation', 'not-frozen', 'refused'].includes(r.rec.status) || (r.rec.status === 'ok' && !r.cap.buildOk)));
  if (faults.length >= 2) return { reason: 'systematic', cells: faults.map(r => ({ cell: r.cell.cell, status: r.rec.status, buildOk: r.cap.buildOk, reason: r.cap.reason?.slice(0, 300) ?? null })) };
  return null;
}
export const overCost = records => records.filter(r => (r.rec.costUsd ?? 0) > COST_LIMIT_USD[r.cell.platform]).map(r => ({ cell: r.cell.cell, costUsd: r.rec.costUsd }));

// This session's own leftovers only (owner decision 6): Java and Dart processes started from the
// toolchain folder (Gradle and Kotlin daemons, Dart tooling) and browsers whose command line points
// into the eval root. Never anything else.
export function ownLeftovers(procs, { toolchain, evalRoot = 'C:\\m3-eval' }) {
  const low = s => String(s ?? '').toLowerCase().replace(/\//g, '\\');
  const tc = low(toolchain);
  const er = low(evalRoot);
  return procs.filter(p => {
    const name = low(p.Name);
    const exe = low(p.ExecutablePath);
    const cmd = low(p.CommandLine);
    if (['java.exe', 'javaw.exe', 'dart.exe', 'dartaotruntime.exe'].includes(name)) return exe.startsWith(tc);
    if (['chrome.exe', 'chrome-headless-shell.exe', 'msedge.exe', 'headless_shell.exe'].includes(name)) return cmd.includes(er);
    return false;
  });
}

export function cleanupOwnProcesses({ log = () => {} } = {}) {
  if (process.platform !== 'win32') return [];
  try {
    const out = execFileSync('powershell', ['-NoProfile', '-Command',
      "Get-CimInstance Win32_Process -Filter \"Name='java.exe' OR Name='javaw.exe' OR Name='dart.exe' OR Name='dartaotruntime.exe' OR Name='chrome.exe' OR Name='chrome-headless-shell.exe' OR Name='msedge.exe' OR Name='headless_shell.exe'\" | Select-Object ProcessId,Name,ExecutablePath,CommandLine | ConvertTo-Json -Compress"],
      { encoding: 'utf8', windowsHide: true, timeout: 60_000 });
    const procs = out.trim() ? [].concat(JSON.parse(out)) : [];
    const mine = ownLeftovers(procs, { toolchain: toolchainRoot() });
    for (const p of mine) {
      try { process.kill(p.ProcessId); log('stopped leftover', p.Name, p.ProcessId); } catch { /* already gone */ }
    }
    return mine.map(p => p.ProcessId);
  } catch (e) { log('leftover check failed:', e.message.slice(0, 200)); return []; }
}

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

// `gradlew --stop` with the toolchain environment: stops every daemon of that Gradle version that uses
// the toolchain's GRADLE_USER_HOME. Failures are ignored (no wrapper, already stopped).
export function stopGradle(projectDir) {
  const win = process.platform === 'win32';
  const wrapper = join(projectDir, win ? 'gradlew.bat' : 'gradlew');
  if (!existsSync(wrapper)) return { ok: false, reason: 'no wrapper' };
  const r = win
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `"${wrapper}" --stop`], { cwd: projectDir, env: withToolchain(process.env), windowsHide: true, windowsVerbatimArguments: true, encoding: 'utf8', timeout: 120_000 })
    : spawnSync('sh', [wrapper, '--stop'], { cwd: projectDir, env: withToolchain(process.env), encoding: 'utf8', timeout: 120_000 });
  return { ok: r.status === 0, output: `${r.stdout ?? ''}${r.stderr ?? ''}`.slice(-500) };
}

const absShots = (shots, dir) => (shots ?? []).map(s => ({ ...s, file: isAbsolute(s.file) ? s.file : join(dir, s.file) }));

async function capture(cell, projectDir, outDir) {
  if (cell.platform === 'web') return (await import('../../harness/web/capture.mjs')).captureWeb({ projectDir, kind: cell.fixture, outDir });
  if (cell.platform === 'flutter') return (await import('../../harness/flutter/capture.mjs')).captureFlutter({ projectDir, outDir });
  return (await import('../../harness/compose/capture.mjs')).captureCompose({ projectDir, outDir });
}

const USAGE = 'usage: pipeline.mjs --run-id <id> (--cells a,b | --all) [--pair 1|2] [--resume] [--judge-only [--recapture a,b]]\n' +
  '       pipeline.mjs --set dev [--skill plugin/skills/material3] [--no-node] --run-id dev-<date>-<platform>-r<n> (--cells a,b | --all) [...]\n' +
  '       pipeline.mjs --phase4 --skill plugin/skills/material3 --run-id p4-<label> (--cells a,b | --all) [--model <id>] [--mem-gate] [--no-judge] [...]';
export const DEV_RUN_ID = /^dev-\d{4}-\d{2}-\d{2}-[a-z]+-r\d+$/;
// Phase 4 (owner, 2026-11-23): the final measurement runs the skill on the eval requests, only under the
// explicit --phase4 flag and a p4-<label> run id, so a dev command can never send an eval request.
export const P4_RUN_ID = /^p4-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5'];

// Command line → options. --set eval (default) is the eval matrix, --set dev the development set. The
// skill runs only on dev cells: running it on an eval request would let it learn the eval's answers.
export function pipelineOptions(argv, root) {
  const arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] ?? null : null; };
  const runId = arg('--run-id');
  const set = arg('--set') ?? 'eval';
  if (!['eval', 'dev'].includes(set)) return { error: `unknown set ${set} (eval or dev)` };
  const all = set === 'dev' ? devCells() : evalCells();
  const cells = argv.includes('--all') ? all : all.filter(c => (arg('--cells') ?? '').split(',').includes(c.cell));
  const pair = Number(arg('--pair') ?? 1);
  const skillArg = arg('--skill');
  if (argv.includes('--skill') && (!skillArg || skillArg.startsWith('--'))) return { error: `--skill needs a skill folder\n${USAGE}` };
  if (!runId || !/^[A-Za-z0-9._-]+$/.test(runId) || !cells.length || !(pair === 1 || pair === 2)) return { error: USAGE };
  const phase4 = argv.includes('--phase4');
  if (phase4 && set !== 'eval') return { error: '--phase4 runs the eval set only' };
  if (phase4 && !skillArg) return { error: '--phase4 needs --skill' };
  if (phase4 && !P4_RUN_ID.test(runId)) return { error: `a Phase 4 run id is p4-<label>, got ${runId}` };
  if (skillArg && set !== 'dev' && !phase4) return { error: 'the skill runs only on the dev set (--set dev); never on eval requests (Phase 4 final runs: --phase4)' };
  if (set === 'dev' && !DEV_RUN_ID.test(runId)) return { error: `a dev run id is dev-<date>-<platform>-r<n>, got ${runId}` };
  const model = arg('--model') ?? 'claude-opus-5-5';
  if (!MODELS.includes(model)) return { error: `unknown model ${model} (${MODELS.join(', ')})` };
  const skillDir = skillArg ? (isAbsolute(skillArg) ? skillArg : join(root, skillArg)) : null;
  if (skillDir && !existsSync(join(skillDir, 'SKILL.md'))) return { error: `no SKILL.md in ${skillDir}` };
  return { runId, set, cells, pair, skillDir, noNode: argv.includes('--no-node'), phase4, model,
    memGate: argv.includes('--mem-gate'), noJudge: argv.includes('--no-judge') };
}

export { latestCanary };

// A canary passed only when its process exited 0 and it wrote a new folder whose verdict passes: a
// canary that crashed before writing its folder must not reuse an older passing verdict.
export const canaryPassed = ({ exit, before, after, verdict }) =>
  exit === 0 && Boolean(after) && after !== before && verdict?.pass === true;

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const opts = pipelineOptions(process.argv.slice(2), root);
  if (opts.error) {
    console.error(opts.error);
    process.exit(2);
  }
  const { runId, cells, pair, skillDir, noNode, phase4, model, memGate, noJudge } = opts;
  const memLog = [];
  // A Phase 4 run measures a committed skill: the skill folder must be clean, and its commit is recorded.
  let skillInfo = null;
  if (skillDir) {
    const git = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8', windowsHide: true }).stdout?.trim() ?? '';
    skillInfo = { commit: git('rev-parse', 'HEAD'), dirty: git('status', '--porcelain', '--', skillDir) !== '' };
    if (phase4 && skillInfo.dirty) { console.error(`the skill folder has uncommitted changes; a Phase 4 run measures a committed skill`); process.exit(2); }
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
  // A skill run then also runs the skill canary, which takes its built-in list from that canary.
  let verdict = null;
  const canaries = [];
  const canary = skill => {
    log(skill ? 'skill canary' : 'canary');
    const before = latestCanary(readdirSync(runsDir), { skill });
    const c = spawnSync(process.execPath, [join(root, 'evals', 'tools', 'canary.mjs'), ...(skill ? ['--skill'] : [])], { cwd: root, encoding: 'utf8', windowsHide: true });
    const latest = latestCanary(readdirSync(runsDir), { skill });
    const f = join(runsDir, latest ?? '', 'verdict.json');
    let v = null;
    try { v = latest && existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; } catch { /* unreadable: not passed */ }
    const pass = canaryPassed({ exit: c.status, before, after: latest, verdict: v });
    canaries.push({ id: latest === before ? null : latest, exit: c.status, pass });
    log('  canary', latest === before ? '(no new canary folder)' : latest, pass ? 'pass' : 'FAIL');
    return pass ? v : { ...v, pass: false };
  };
  const runCanary = () => {
    verdict = canary(false);
    if (verdict?.pass && skillDir) verdict = canary(true);
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
    const rec = await runCell({ cell, runId, root, builtIns, allowedSkills: verdict.allowedSkills, skillDir, noNode, model, finalEval: phase4,
      prepare: async w => { const r = await prepareFixture(cell.fixture, w); if (!r.ok) throw new Error(`fixture ${cell.fixture} failed:\n${r.log.slice(-2000)}`); } });
    log('  status', cell.cell, rec.status, 'durationMs', rec.durationMs, 'cost', rec.costUsd);
    return captureAndVerify(cell, rec, dest);
  };

  // Capture and verify a finished run. Also used by --recapture after a harness fix.
  const captureAndVerify = async (cell, rec, dest) => {
    let cap ={ buildOk: false, reason: `run status ${rec.status}`, shots: [], runtime: { contrast: [], targets: [] } };
    if (['ok', 'secret-redacted', 'asked-question', 'timeout', 'session-error'].includes(rec.status) && !isQuotaStop(rec) && existsSync(rec.workDir ?? '')) {
      const shotDir = join('C:\\m3-eval', 'shots', runId, cell.cell);
      // The session's own Gradle daemon is idle by now; stop it before the capture starts another.
      if (cell.platform === 'compose') stopGradle(rec.workDir);
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
      auto: automatedScores(ver?.error ? null : ver, cap.buildOk && cap.shots.length > 0),
      autoV2: automatedScores(ver?.error ? null : ver, cap.buildOk && cap.shots.length > 0, 'v2') };
    // A Compose cell leaves Gradle daemons behind (the session's builds); stop them so they do not hold
    // memory while the next cell runs (owner, 2026-11-17).
    if (cell.platform === 'compose' && existsSync(rec.workDir ?? '')) stopGradle(rec.workDir);
    writeFileSync(join(dest, 'record.json'), JSON.stringify(out, null, 2));
    return out;
  };

  const records = [];
  const groups = [];
  let sinceCanary = null;
  let stopped = null;
  // --judge-only: no new runs; every cell's record.json is reused, and the cells named by --recapture
  // are captured and verified again first (a harness fix after the runs). An earlier judging of this
  // run is moved to superseded-<n>/ unread.
  const judgeOnly = process.argv.includes('--judge-only');
  if (judgeOnly) {
    const again = (arg('--recapture') ?? '').split(',').filter(Boolean);
    for (const cell of cells) {
      const dest = join(priv, cell.cell);
      if (!existsSync(join(dest, 'record.json'))) { console.error(`no record for ${cell.cell}`); process.exit(2); }
      let saved = JSON.parse(readFileSync(join(dest, 'record.json'), 'utf8'));
      if (again.includes(cell.cell)) {
        log('recapture', cell.cell);
        const previous = saved.cap.reason ?? null;
        saved = await captureAndVerify(cell, saved.rec, dest);
        saved.recaptured = { at: new Date().toISOString(), previousReason: previous?.slice(-500) ?? null };
        writeFileSync(join(dest, 'record.json'), JSON.stringify(saved, null, 2));
      }
      records.push(saved);
    }
    if (existsSync(join(priv, 'summary.json'))) {
      const { renameSync } = await import('node:fs');
      let n = 1;
      while (existsSync(join(priv, `superseded-${n}`))) n++;
      mkdirSync(join(priv, `superseded-${n}`));
      for (const f of ['summary.json', 'mapping.json']) if (existsSync(join(priv, f))) renameSync(join(priv, f), join(priv, `superseded-${n}`, f));
      log('earlier judging moved to', `superseded-${n}`);
    }
  }
  const queue = judgeOnly ? [] : schedule(cells, { pair });
  let composeBlockedSince = null;
  while (queue.length) {
    let pick = 0;
    if (memGate) {
      // Owner decision 6 (2026-11-23): before every group, clean this session's leftovers and check
      // the available memory; a group whose threshold does not hold waits (10-minute re-checks) while
      // the web/Flutter groups that fit run first; Compose not fitting for 3 hours stops the run.
      for (;;) {
        cleanupOwnProcesses({ log });
        const availGb = freemem() / 2 ** 30;
        pick = pickGroup(queue, availGb);
        log('memory', availGb.toFixed(2), 'GB available; next group', pick >= 0 ? queue[pick].map(c => c.cell).join(',') : 'none fits');
        if (pick >= 0) {
          if (queue[pick][0].platform === 'compose') composeBlockedSince = null;
          break;
        }
        if (queue.some(g => g[0].platform === 'compose')) composeBlockedSince ??= Date.now();
        if (composeBlockedSince && Date.now() - composeBlockedSince >= COMPOSE_WAIT_MS) {
          stopped = { reason: 'memory', waitedMs: Date.now() - composeBlockedSince, left: queue.flat().map(c => c.cell) };
          break;
        }
        memLog.push({ at: new Date().toISOString(), availGb: +availGb.toFixed(2), waiting: queue.flat().map(c => c.cell) });
        writeFileSync(join(priv, 'groups.json'), JSON.stringify({ skill: skillInfo, model, canaries, groups, memLog, overCost: overCost(records) }, null, 2));
        await new Promise(r => setTimeout(r, MEM_RECHECK_MS));
      }
      if (stopped) break;
      if (queue.some((g, i) => i !== pick && g[0].platform === 'compose') && queue[pick][0].platform !== 'compose') composeBlockedSince ??= Date.now();
    }
    const group = queue.splice(pick, 1)[0];
    if (canaryDue({ sinceCanary, next: group.length })) {
      if (!runCanary()) { stopped = { reason: 'canary failed', before: group.map(c => c.cell) }; break; }
      sinceCanary = 0;
    }
    const mem = memSampler();
    const t0 = Date.now();
    const recs = await Promise.all(group.map(doCell));
    if (phase4) {
      // Memory-caused failures (owner, relay 2026-11-23): clean up, retry once (a timed-out session runs
      // again; a capture that failed runs the capture again), then skip and report.
      for (let i = 0; i < recs.length; i++) {
        if (!memoryFailure(recs[i])) continue;
        const cell = recs[i].cell;
        const dest = join(priv, cell.cell);
        log('memory failure', cell.cell, recs[i].rec.status, String(recs[i].cap.reason ?? '').slice(0, 200));
        cleanupOwnProcesses({ log });
        if (cell.platform === 'compose' && existsSync(recs[i].rec.workDir ?? '')) stopGradle(recs[i].rec.workDir);
        const { renameSync } = await import('node:fs');
        let n = 1;
        while (existsSync(`${dest}-attempt${n}`)) n++;
        const first = { status: recs[i].rec.status, reason: recs[i].cap.reason ?? null, attempt: `${cell.cell}-attempt${n}` };
        let again;
        if (recs[i].rec.status === 'timeout') {
          renameSync(dest, `${dest}-attempt${n}`);
          again = await doCell(cell);
        } else {
          cpSync(dest, `${dest}-attempt${n}`, { recursive: true });
          again = await captureAndVerify(cell, recs[i].rec, dest);
        }
        again.memoryRetry = first;
        if (memoryFailure(again)) { again.memorySkipped = true; log('memory failure again, skipped:', cell.cell); }
        writeFileSync(join(dest, 'record.json'), JSON.stringify(again, null, 2));
        recs[i] = again;
      }
    }
    const g = { cells: group.map(c => c.cell), wallMs: Date.now() - t0, memory: mem.stop(),
      costUsd: +recs.reduce((a, r) => a + (r.rec.costUsd ?? 0), 0).toFixed(4) };
    sinceCanary += group.length;
    records.push(...recs);
    groups.push(g);
    writeFileSync(join(priv, 'groups.json'), JSON.stringify({ skill: skillInfo, model, canaries, groups, memLog, overCost: overCost(records) }, null, 2));
    log('group done', JSON.stringify(g));
    const q = recs.find(r => isQuotaStop(r.rec));
    if (q) { stopped = { reason: 'quota', cell: q.cell.cell, text: q.rec.resultText }; log('QUOTA: stopping; no further cell starts'); break; }
    if (phase4) {
      const s = phase4Stop(records);
      if (s) { stopped = s; log('PHASE 4 STOP:', JSON.stringify(s)); break; }
    }
  }

  // Blind judging over every output of this run; skipped when the run stopped early or with --no-judge
  // (Phase 4 judges with evals/tools/pooled3.mjs: three sessions, medians).
  const outputs = stopped || noJudge ? [] : records.filter(r => r.cap.shots.length).map(r => ({
    cell: r.cell.cell, condition: skillDir ? 'skill' : 'baseline', repeat: 1, runId, request: judgeRequest(r.cell, root), shots: r.cap.shots }));
  const scores = [];
  const judgeLog = [];
  if (outputs.length) {
    const judgeDir = join('C:\\m3-eval', 'judge-in', judgeOnly ? `${runId}-rejudge-${Date.now()}` : runId);
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
      const r = await runJudgeBatch({ judgeDir, ids: batch, root, batchId: `${runId}${judgeOnly ? '-rj' + Date.now() : ''}-${i / 12 + 1}`, builtIns });
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
    automated: r.auto, automatedV2: r.autoV2 ?? null,
    judged: Object.fromEntries(ITEMS.map(it => [it, byCell[r.cell.cell]?.[it]?.score ?? (r.cap.shots.length ? null : 0)])),
    reasons: byCell[r.cell.cell] ?? null,
    isolation: { init: r.rec.checks?.init?.ok ?? null, audit: r.rec.checks?.audit?.ok ?? null, preflight: r.rec.checks?.preflight?.ok ?? null, warnings: r.rec.checks?.audit?.hits?.length ?? 0 },
  }));
  writeFileSync(join(priv, 'summary.json'), JSON.stringify({ runId, stopped, canaries, groups, judgeLog, summary }, null, 2));
  console.log(JSON.stringify(summary.map(s => ({ cell: s.cell, status: s.status, min: s.durationMs && +(s.durationMs / 60000).toFixed(1), usd: s.costUsd, buildOk: s.buildOk, automated: s.automated, judged: s.judged })), null, 1));
  if (stopped) { console.error('stopped:', JSON.stringify(stopped)); process.exitCode = 3; }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

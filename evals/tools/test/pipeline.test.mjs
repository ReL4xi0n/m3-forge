import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { automatedScores, judgeRequest, schedule, isQuotaStop, canaryDue } from '../pipeline.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const v = (counts, uiLines = 200) => ({ counts, uiLines });

test('automatedScores: rubric bands for token fidelity, contrast/targets and anti-patterns', () => {
  assert.deepEqual(automatedScores(v({}), true), { 'token-fidelity': 3, 'contrast-targets': 3, 'anti-patterns': 3 });
  // 2 token hits in 200 lines = 1 per 100 → 2; 3 per 100 → 1; 12 per 100 → 0
  assert.equal(automatedScores(v({ 'hardcoded-color': 2 }), true)['token-fidelity'], 2);
  assert.equal(automatedScores(v({ 'hardcoded-color': 4, 'off-token-type': 2 }), true)['token-fidelity'], 1);
  assert.equal(automatedScores(v({ 'off-token-radius': 24 }), true)['token-fidelity'], 0);
  assert.equal(automatedScores(v({ contrast: 1, 'touch-target': 1 }), true)['contrast-targets'], 2);
  assert.equal(automatedScores(v({ contrast: 6 }), true)['contrast-targets'], 1);
  assert.equal(automatedScores(v({ 'touch-target': 7 }), true)['contrast-targets'], 0);
  assert.equal(automatedScores(v({ 'icon-source': 1 }), true)['anti-patterns'], 2);
  assert.equal(automatedScores(v({ 'shadow-gradient': 2, 'foreign-styling': 2 }), true)['anti-patterns'], 1);
  assert.equal(automatedScores(v({ 'shadow-gradient': 5 }), true)['anti-patterns'], 0);
  assert.equal(automatedScores(v({ 'off-grid-spacing': 40 }), true)['token-fidelity'], 3, 'off-grid spacing is a warning only');
});

test('automatedScores: no buildable output scores 0 on every automated item', () => {
  assert.deepEqual(automatedScores(v({}), false), { 'token-fidelity': 0, 'contrast-targets': 0, 'anti-patterns': 0 });
  assert.deepEqual(automatedScores(null, true), { 'token-fidelity': 0, 'contrast-targets': 0, 'anti-patterns': 0 });
});

test('judgeRequest: the request, the style line and the platform, without the folder sentence', () => {
  const t = judgeRequest({ request: 'settings', platform: 'flutter', fixture: 'flutter-material_ui', variant: 'default' }, root);
  assert.match(t, /^# Settings screen/);
  assert.match(t, /M3 Expressive style/);
  assert.match(t, /Platform: Flutter\.$/);
  assert.doesNotMatch(t, /folder/);
});

const C = (name, platform) => ({ cell: name, platform });

test('schedule: the first Compose cell runs alone first; web and Flutter cells run in pairs; other Compose cells run alone', () => {
  const cells = [C('w1', 'web'), C('f1', 'flutter'), C('c1', 'compose'), C('w2', 'web'), C('c2', 'compose'), C('f2', 'flutter'), C('w3', 'web')];
  const groups = schedule(cells, { pair: 2 }).map(g => g.map(c => c.cell));
  assert.deepEqual(groups[0], ['c1']);
  for (const g of groups) {
    if (g.some(n => n.startsWith('c'))) assert.equal(g.length, 1, `compose alone: ${g}`);
    else assert.ok(g.length <= 2, `${g}`);
  }
  assert.deepEqual(groups.flat().sort(), cells.map(c => c.cell).sort());
  assert.deepEqual(schedule(cells, { pair: 1 }).map(g => g.length), cells.map(() => 1));
});

test('canaryDue: before the first group, and again once 6 or more cells have run since the last canary', () => {
  assert.equal(canaryDue({ sinceCanary: null, next: 2 }), true);
  assert.equal(canaryDue({ sinceCanary: 4, next: 2 }), false);
  assert.equal(canaryDue({ sinceCanary: 5, next: 2 }), true);
  assert.equal(canaryDue({ sinceCanary: 6, next: 1 }), true);
});

test('isQuotaStop: a session that ends on a usage or rate limit stops the batch; other errors do not', () => {
  assert.equal(isQuotaStop({ status: 'session-error', resultText: "Claude AI usage limit reached|1794600000" }), true);
  assert.equal(isQuotaStop({ status: 'session-error', resultText: "You've hit your limit · resets 3am" }), true);
  assert.equal(isQuotaStop({ status: 'session-error', resultText: 'API Error: 429 rate_limit_error' }), true);
  assert.equal(isQuotaStop({ status: 'session-error', resultText: 'API Error: 500 overloaded' }), false);
  assert.equal(isQuotaStop({ status: 'ok', resultText: null }), false);
});

test('automatedScores v2: icon source is its own item and no longer part of anti-patterns', () => {
  const v2 = (counts, uiLines = 100) => ({ counts, uiLines });
  assert.deepEqual(automatedScores(v2({}), true, 'v2'), { 'token-fidelity': 3, 'contrast-targets': 3, 'anti-patterns': 3, 'icon-source': 3 });
  const legacyIcons = automatedScores(v2({ 'icon-source': 25 }), true, 'v2');
  assert.equal(legacyIcons['anti-patterns'], 3, 'Icons.* alone does not zero anti-patterns');
  assert.equal(legacyIcons['icon-source'], 0);
  assert.equal(automatedScores(v2({ 'icon-source': 1 }), true, 'v2')['icon-source'], 2);
  assert.equal(automatedScores(v2({ 'icon-source': 4 }), true, 'v2')['icon-source'], 1);
  assert.equal(automatedScores(v2({ 'shadow-gradient': 2, 'foreign-styling': 2 }), true, 'v2')['anti-patterns'], 1);
  assert.deepEqual(automatedScores(null, true, 'v2'), { 'token-fidelity': 0, 'contrast-targets': 0, 'anti-patterns': 0, 'icon-source': 0 });
  assert.deepEqual(automatedScores(v2({ 'icon-source': 25 }), true), automatedScores(v2({ 'icon-source': 25 }), true, 'v1'), 'v1 stays the default');
  assert.equal(automatedScores(v2({ 'icon-source': 25 }), true)['anti-patterns'], 0, 'v1 unchanged');
});

// ---- Dev runs with the skill (Phase 3, Task 2) ----

test('pipelineOptions: a dev run with the skill, its cells, and --no-node', async () => {
  const { pipelineOptions } = await import('../pipeline.mjs');
  const { devCells } = await import('../cells.mjs');
  const cells = devCells().filter(c => c.platform === 'web').slice(0, 2).map(c => c.cell);
  const o = pipelineOptions(['--set', 'dev', '--skill', 'plugin/skills/material3', '--run-id', 'dev-2026-11-17-web-r1', '--cells', cells.join(',')], root);
  assert.equal(o.error, undefined);
  assert.equal(o.set, 'dev');
  assert.deepEqual(o.cells.map(c => c.cell), cells);
  assert.ok(o.cells.every(c => c.set === 'dev'));
  assert.equal(o.skillDir, join(root, 'plugin', 'skills', 'material3'));
  assert.equal(o.noNode, false);
  assert.equal(pipelineOptions(['--set', 'dev', '--skill', 'plugin/skills/material3', '--run-id', 'dev-2026-11-17-web-r2', '--all', '--no-node'], root).noNode, true);
  assert.equal(pipelineOptions(['--set', 'dev', '--run-id', 'dev-2026-11-17-mixed-r3', '--all'], root).cells.length, 12);
});

test('pipelineOptions: the skill never runs on eval requests, and dev run ids follow dev-<date>-<platform>-r<n>', async () => {
  const { pipelineOptions } = await import('../pipeline.mjs');
  const evalCell = 'settings.web.web-react.default';
  assert.match(pipelineOptions(['--skill', 'plugin/skills/material3', '--run-id', 'x1', '--cells', evalCell], root).error, /only on the dev set/);
  assert.match(pipelineOptions(['--set', 'eval', '--skill', 'plugin/skills/material3', '--run-id', 'x1', '--all'], root).error, /only on the dev set/);
  assert.match(pipelineOptions(['--set', 'dev', '--skill', 'plugin/skills/material3', '--run-id', 'baseline-x', '--all'], root).error, /run id/);
  assert.match(pipelineOptions(['--set', 'dev', '--skill', 'plugin/skills/missing', '--run-id', 'dev-2026-11-17-web-r1', '--all'], root).error, /SKILL\.md/);
  assert.match(pipelineOptions(['--set', 'other', '--run-id', 'x1', '--all'], root).error, /set/);
  // An eval cell id is not a dev cell.
  assert.ok(pipelineOptions(['--set', 'dev', '--run-id', 'dev-2026-11-17-web-r1', '--cells', evalCell], root).error);
  // The baseline call is unchanged.
  const b = pipelineOptions(['--run-id', 'baseline-x', '--cells', evalCell, '--pair', '2'], root);
  assert.equal(b.error, undefined);
  assert.equal(b.set, 'eval');
  assert.equal(b.skillDir, null);
  assert.equal(b.pair, 2);
  assert.deepEqual(b.cells.map(c => c.cell), [evalCell]);
});

test('canaryKind: skill canaries and baseline canaries are told apart by their folder name', async () => {
  const { latestCanary } = await import('../pipeline.mjs');
  assert.equal(latestCanary, (await import('../canary.mjs')).latestCanary);
  const dirs = ['canary-2026-11-17-08-51-40', 'canary-2026-11-17-09-00-00-skill', 'canary-2026-11-16-19-57-45', 'baseline-x'];
  assert.equal(latestCanary(dirs, { skill: false }), 'canary-2026-11-17-08-51-40');
  assert.equal(latestCanary(dirs, { skill: true }), 'canary-2026-11-17-09-00-00-skill');
  assert.equal(latestCanary(['canary-2026-11-17-08-51-40'], { skill: true }), undefined);
});

test('pipelineOptions: --skill without a value is a usage error, never a silent run without the skill', async () => {
  const { pipelineOptions } = await import('../pipeline.mjs');
  assert.match(pipelineOptions(['--set', 'dev', '--run-id', 'dev-2026-11-17-web-r1', '--all', '--skill'], root).error, /--skill needs/);
  assert.match(pipelineOptions(['--set', 'dev', '--skill', '--no-node', '--run-id', 'dev-2026-11-17-web-r1', '--all'], root).error, /--skill needs/);
});

test('canaryPassed: only a canary that exited 0 and wrote a new passing verdict counts', async () => {
  const { canaryPassed } = await import('../pipeline.mjs');
  const pass = { pass: true };
  assert.equal(canaryPassed({ exit: 0, before: 'canary-1', after: 'canary-2', verdict: pass }), true);
  assert.equal(canaryPassed({ exit: 0, before: undefined, after: 'canary-2', verdict: pass }), true);
  assert.equal(canaryPassed({ exit: 1, before: 'canary-1', after: 'canary-2', verdict: pass }), false, 'non-zero exit');
  assert.equal(canaryPassed({ exit: null, before: 'canary-1', after: 'canary-2', verdict: pass }), false, 'killed');
  assert.equal(canaryPassed({ exit: 0, before: 'canary-1', after: 'canary-1', verdict: pass }), false, 'an older verdict is not reused');
  assert.equal(canaryPassed({ exit: 0, before: 'canary-1', after: undefined, verdict: null }), false);
  assert.equal(canaryPassed({ exit: 0, before: 'canary-1', after: 'canary-2', verdict: { pass: false } }), false);
});

test('pipelineOptions: Phase 4 final runs need --phase4, --skill and a p4-<label> run id', async () => {
  const { pipelineOptions } = await import('../pipeline.mjs');
  const skill = ['--skill', 'plugin/skills/material3'];
  const o = pipelineOptions(['--phase4', ...skill, '--run-id', 'p4-final-1', '--all', '--pair', '2', '--mem-gate', '--no-judge'], root);
  assert.equal(o.error, undefined);
  assert.equal(o.set, 'eval');
  assert.equal(o.cells.length, 26);
  assert.equal(o.phase4, true);
  assert.equal(o.memGate, true);
  assert.equal(o.noJudge, true);
  assert.equal(o.model, 'claude-opus-5-5');
  assert.match(pipelineOptions([...skill, '--run-id', 'p4-final-1', '--all'], root).error, /only on the dev set/);
  assert.match(pipelineOptions(['--phase4', '--run-id', 'p4-final-1', '--all'], root).error, /needs --skill/);
  assert.match(pipelineOptions(['--phase4', ...skill, '--run-id', 'final-1', '--all'], root).error, /p4-<label>/);
  assert.match(pipelineOptions(['--phase4', '--set', 'dev', ...skill, '--run-id', 'p4-x', '--all'], root).error, /eval set only/);
  const s = pipelineOptions(['--phase4', ...skill, '--run-id', 'p4-sonnet', '--cells', 'product-detail.web.web-empty.default', '--model', 'claude-sonnet-5-5'], root);
  assert.equal(s.model, 'claude-sonnet-5-5');
  assert.match(pipelineOptions(['--phase4', ...skill, '--run-id', 'p4-x', '--all', '--model', 'gpt'], root).error, /unknown model/);
});

test('pickGroup: thresholds per platform; a web/Flutter group that fits runs before a Compose group that does not', async () => {
  const { pickGroup } = await import('../pipeline.mjs');
  const c = { platform: 'compose' }, w = { platform: 'web' }, f = { platform: 'flutter' };
  const q = [[c], [w, f], [c]];
  assert.equal(pickGroup(q, 1.6), 0);
  assert.equal(pickGroup(q, 1.3), 1);
  assert.equal(pickGroup(q, 1.1), -1);
  assert.equal(pickGroup([[c]], 1.49), -1);
  assert.equal(pickGroup([[c]], 1.5), 0);
});

test('phase4Stop: no cost stop; two non-memory faults stop; memory failures never stop', async () => {
  const { phase4Stop, memoryFailure, overCost } = await import('../pipeline.mjs');
  const r = (platform, costUsd, status = 'ok', buildOk = true, reason = null) => ({ cell: { cell: `x.${platform}`, platform }, rec: { costUsd, status }, cap: { buildOk, reason } });
  assert.equal(phase4Stop([r('web', 7.0), r('compose', 9.0)]), null);
  assert.deepEqual(overCost([r('web', 7.0), r('web', 2)]).map(x => x.costUsd), [7.0]);
  assert.equal(phase4Stop([r('web', 2, 'invalid-isolation')]), null, 'one fault is not systematic');
  assert.equal(phase4Stop([r('web', 2, 'invalid-isolation'), r('flutter', 2, 'ok', false, 'compile error')]).reason, 'systematic');
  assert.equal(phase4Stop([r('web', 2, 'timeout'), r('compose', 2, 'ok', false, 'java.lang.OutOfMemoryError: Java heap space')]), null, 'memory failures are retried, not stops');
  assert.equal(phase4Stop([r('web', 2, 'asked-question', false), r('web', 2)]), null, 'only faults of the run, not the model');
  assert.equal(memoryFailure(r('compose', 2, 'ok', false, 'Gradle build daemon disappeared unexpectedly')), true);
  assert.equal(memoryFailure(r('compose', 2, 'ok', false, 'compile error')), false);
  assert.equal(memoryFailure(r('web', 2, 'timeout')), true);
});

test('ownLeftovers: only toolchain Java/Dart and browsers pointed at the eval root', async () => {
  const { ownLeftovers } = await import('../pipeline.mjs');
  const procs = [
    { ProcessId: 1, Name: 'java.exe', ExecutablePath: String.raw`C:\Users\u\.m3-toolchain\jdk-21\bin\java.exe`, CommandLine: 'GradleDaemon' },
    { ProcessId: 2, Name: 'java.exe', ExecutablePath: String.raw`C:\Program Files\Java\bin\java.exe`, CommandLine: 'someone else' },
    { ProcessId: 3, Name: 'dart.exe', ExecutablePath: 'C:/Users/u/.m3-toolchain/flutter/bin/cache/dart-sdk/bin/dart.exe', CommandLine: '' },
    { ProcessId: 4, Name: 'chrome.exe', ExecutablePath: String.raw`C:\Program Files\Google\Chrome\chrome.exe`, CommandLine: String.raw`chrome.exe --user-data-dir=C:\m3-eval\appdata\x` },
    { ProcessId: 5, Name: 'chrome.exe', ExecutablePath: String.raw`C:\Program Files\Google\Chrome\chrome.exe`, CommandLine: 'chrome.exe --profile-directory=Default' },
    { ProcessId: 6, Name: 'Spotify.exe', ExecutablePath: String.raw`C:\m3-eval\x.exe`, CommandLine: String.raw`C:\m3-eval` },
  ];
  assert.deepEqual(ownLeftovers(procs, { toolchain: String.raw`C:\Users\u\.m3-toolchain` }).map(p => p.ProcessId), [1, 3, 4]);
});

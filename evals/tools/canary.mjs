#!/usr/bin/env node
// Isolation canaries (Phase 2 plan, Task 4: V4 and V5).
//   canary.mjs            V4: an isolated session reports its skills/commands/MCP/memory and tries to
//                         read three protected files; all reads must be denied.
//   canary.mjs --negative V5: the same init check on a session that uses the real ~/.claude must FAIL.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCell, DEFAULT_MODEL } from './run-cell.mjs';
import { checkInit, findInit, ownerInstalledNames, probeBuiltIns } from './isolation.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function canaryPrompt({ repoRoot, cfgDir }) {
  return [
    'This is an isolation check. Do the following and nothing else.',
    '1. List every skill, slash command, MCP server and plugin available to you, and quote any CLAUDE.md',
    '   or memory instructions you were given. Write "none" for an empty category.',
    `2. Use the Read tool on each of these files and report whether each read succeeded:`,
    `   - ${join(repoRoot, 'knowledge', 'README.md')}`,
    `   - ${join(repoRoot, 'private', 'README.md')}`,
    `   - ${join(cfgDir, 'settings.json')}`,
    'Do not use any other tool.',
  ].join('\n');
}

// Skill-run canary (Phase 3, Task 2): the same three protected reads through the /material3 slash
// command, plus one read inside the installed skill folder, which must succeed.
export const skillFile = cfgDir => join(cfgDir, 'skills', 'material3', 'SKILL.md');
export function skillCanaryPrompt({ repoRoot, cfgDir }) {
  return [
    '/material3 Isolation check. Use the Read tool once on each of these files, in this order, and use no other tool:',
    `- ${join(repoRoot, 'knowledge', 'README.md')}`,
    `- ${join(repoRoot, 'private', 'README.md')}`,
    `- ${join(cfgDir, 'settings.json')}`,
    `- ${skillFile(cfgDir)}`,
  ].join('\n');
}

// The stub installed for the skill canary: the real skill's frontmatter fields, and a body that makes
// the reply show whether the skill was loaded.
export const STUB_SKILL = [
  '---',
  'name: material3',
  'description: Stub skill for the with-skill isolation canary.',
  'argument-hint: "<UI request>"',
  'disable-model-invocation: true',
  '---',
  '',
  'This skill is a stub for an isolation check. Carry out the request below exactly. Write no text until',
  'every step is done, whatever the steps return. Then reply with exactly `OK` and nothing else.',
  '',
  'Request: $ARGUMENTS',
  '',
].join('\n');

// The newest canary of the right kind: a skill run needs a skill canary (folder name ends in -skill).
export const latestCanary = (dirs, { skill }) =>
  dirs.filter(d => d.startsWith('canary-') && d.endsWith('-skill') === Boolean(skill)).sort().pop();

const events = lines => lines.map(l => { try { return typeof l === 'string' ? JSON.parse(l) : l; } catch { return null; } }).filter(Boolean);

// Names in the init event beyond Claude Code's built-ins.
export const extraNames = (init, builtIns) => [...new Set([...(init?.skills ?? []), ...(init?.slash_commands ?? [])])].filter(n => !builtIns.includes(n)).sort();

export function finalReply(lines) {
  const res = events(lines).filter(e => e.type === 'result').pop();
  return typeof res?.result === 'string' ? res.result.trim() : null;
}

// True when a Read of `path` returned without an error.
export function readSucceeded(lines, path) {
  const want = path.toLowerCase().replace(/\\/g, '/');
  const ids = new Set();
  let ok = false;
  for (const e of events(lines)) {
    for (const c of e.message?.content ?? []) {
      if (c.type === 'tool_use' && c.name === 'Read' && String(c.input?.file_path ?? '').toLowerCase().replace(/\\/g, '/') === want) ids.add(c.id);
      if (c.type === 'tool_result' && ids.has(c.tool_use_id) && c.is_error !== true) ok = true;
    }
  }
  return ok;
}

// Pass: every protected read ended in a permission denial (from the result event or an error result).
export function readsDenied(lines, paths) {
  const events = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const result = events.filter(e => e.type === 'result').pop();
  const denied = new Set();
  for (const d of result?.permission_denials ?? []) {
    const fp = d.tool_input?.file_path;
    if (fp) denied.add(fp.toLowerCase().replace(/\\/g, '/'));
  }
  const missing = paths.filter(p => !denied.has(p.toLowerCase().replace(/\\/g, '/')));
  return { ok: missing.length === 0, missing };
}

async function main() {
  // The skill canary names its own folder (…-skill); create no baseline canary folder for it.
  if (process.argv.includes('--skill')) {
    await skillCanary();
    return;
  }
  const runId = `canary-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;
  const outDir = join(root, 'private', 'evals', 'runs', runId);
  mkdirSync(outDir, { recursive: true });
  if (process.argv.includes('--negative')) {
    const work = join('C:\\m3-eval', 'work', runId);
    mkdirSync(work, { recursive: true });
    const env = { ...process.env };
    delete env.CLAUDE_CONFIG_DIR;
    const p = spawnSync('claude', ['-p', 'Reply with the single word OK.', '--output-format', 'stream-json', '--verbose',
      '--model', DEFAULT_MODEL, '--max-turns', '1', '--no-session-persistence'], { cwd: work, env, encoding: 'utf8', shell: true });
    const { init, preInit } = findInit(p.stdout.split(/\r?\n/).filter(Boolean));
    const realCfg = join(process.env.USERPROFILE, '.claude');
    const check = checkInit(init, { workDir: work, cfgDir: null, forbiddenNames: ownerInstalledNames(realCfg), preInit });
    // It must fail on what the real config loads, not merely because no init event was found.
    const verdict = { expect: 'fail', got: check.ok ? 'pass' : 'fail', problems: check.problems.length, pass: Boolean(init) && !check.ok };
    writeFileSync(join(outDir, 'negative.json'), JSON.stringify({ ...verdict, problemsList: check.problems }, null, 2));
    console.log(JSON.stringify(verdict));
    process.exitCode = verdict.pass ? 0 : 1;
    return;
  }
  const cell = { cell: 'canary', request: 'settings', platform: 'web', fixture: 'web-empty', variant: 'default' };
  const cfgDir = join('C:\\m3-eval', 'cfg', runId, 'canary');
  const prompt = canaryPrompt({ repoRoot: root, cfgDir });
  const rec = await runCell({ cell, runId, root, kind: 'canary', requireFrozen: false, promptOverride: prompt });
  const { readFileSync } = await import('node:fs');
  const lines = readFileSync(join(outDir, 'canary', 'run.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean);
  const reads = readsDenied(lines, [join(root, 'knowledge', 'README.md'), join(root, 'private', 'README.md'), join(cfgDir, 'settings.json')]);
  const { init } = findInit(lines);
  const verdict = {
    status: rec.status, init: rec.checks?.init?.ok, audit: rec.checks?.audit?.ok, readsDenied: reads.ok,
    builtIns: [...new Set([...(init.skills ?? []), ...(init.slash_commands ?? [])])].length,
    pass: rec.checks?.init?.ok === true && reads.ok && rec.status !== 'secret-redacted',
  };
  writeFileSync(join(outDir, 'verdict.json'), JSON.stringify({ ...verdict, missingDenials: reads.missing, allowedSkills: [...new Set([...(init.skills ?? []), ...(init.slash_commands ?? [])])] }, null, 2));
  console.log(JSON.stringify(verdict));
  process.exitCode = verdict.pass ? 0 : 1;
}

// canary.mjs --skill: a skill run with a stub skill. Pass: the init lists exactly material3 beyond the
// built-ins (and passes every other init check), the three protected reads are denied, the read in the
// skill folder succeeds, and the reply is OK (the skill was loaded).
// The built-in list is the one of the newest baseline canary, which must have passed: a logged-in
// session has built-ins (e.g. advisor, schedule) that the no-login probe does not show (2026-11-17).
async function skillCanary() {
  const runId = `canary-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}-skill`;
  const runsDir = join(root, 'private', 'evals', 'runs');
  const outDir = join(runsDir, runId);
  mkdirSync(outDir, { recursive: true });
  const base = latestCanary(readdirSync(runsDir), { skill: false });
  const baseVerdict = base && existsSync(join(runsDir, base, 'verdict.json')) ? JSON.parse(readFileSync(join(runsDir, base, 'verdict.json'), 'utf8')) : null;
  if (!baseVerdict?.pass || !Array.isArray(baseVerdict.allowedSkills)) {
    const verdict = { pass: false, reason: `no passing baseline canary to take the built-in list from (newest: ${base ?? 'none'}); run canary.mjs first` };
    writeFileSync(join(outDir, 'verdict.json'), JSON.stringify(verdict, null, 2));
    console.log(JSON.stringify(verdict));
    process.exitCode = 1;
    return;
  }
  const builtIns = baseVerdict.allowedSkills;
  const stub = join('C:\\m3-eval', 'stub', runId, 'material3');
  mkdirSync(stub, { recursive: true });
  writeFileSync(join(stub, 'SKILL.md'), STUB_SKILL);
  const cell = { cell: 'canary', request: 'podcast-player', platform: 'web', fixture: 'web-empty', variant: 'default', set: 'dev' };
  const cfgDir = join('C:\\m3-eval', 'cfg', runId, 'canary');
  let rec;
  try {
    rec = await runCell({ cell, runId, root, kind: 'canary', requireFrozen: false, builtIns: probeBuiltIns(), allowedSkills: builtIns,
      skillDir: stub, promptOverride: skillCanaryPrompt({ repoRoot: root, cfgDir }) });
  } finally {
    rmSync(join('C:\\m3-eval', 'stub', runId), { recursive: true, force: true });
  }
  const lines = readFileSync(join(outDir, 'canary', 'run.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean);
  const reads = readsDenied(lines, [join(root, 'knowledge', 'README.md'), join(root, 'private', 'README.md'), join(cfgDir, 'settings.json')]);
  const { init } = findInit(lines);
  const extra = extraNames(init, builtIns);
  const verdict = {
    status: rec.status, init: rec.checks?.init?.ok, audit: rec.checks?.audit?.ok, extraNames: extra,
    readsDenied: reads.ok, skillRead: readSucceeded(lines, skillFile(cfgDir)), reply: finalReply(lines), costUsd: rec.costUsd,
  };
  verdict.pass = verdict.init === true && JSON.stringify(extra) === '["material3"]' && reads.ok && verdict.skillRead &&
    verdict.reply === 'OK' && rec.status !== 'secret-redacted';
  writeFileSync(join(outDir, 'verdict.json'), JSON.stringify({ ...verdict, builtInsFrom: base, missingDenials: reads.missing, initProblems: rec.checks?.init?.problems ?? null,
    allowedSkills: [...new Set([...(init?.skills ?? []), ...(init?.slash_commands ?? [])])] }, null, 2));
  console.log(JSON.stringify(verdict));
  process.exitCode = verdict.pass ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

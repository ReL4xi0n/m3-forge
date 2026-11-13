#!/usr/bin/env node
// Isolation canaries (Phase 2 plan, Task 4: V4 and V5).
//   canary.mjs            V4: an isolated session reports its skills/commands/MCP/memory and tries to
//                         read three protected files; all reads must be denied.
//   canary.mjs --negative V5: the same init check on a session that uses the real ~/.claude must FAIL.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCell, DEFAULT_MODEL } from './run-cell.mjs';
import { checkInit, ownerInstalledNames } from './isolation.mjs';

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
    const init = JSON.parse(p.stdout.split(/\r?\n/)[0] || 'null');
    const realCfg = join(process.env.USERPROFILE, '.claude');
    const check = checkInit(init, { workDir: work, cfgDir: null, forbiddenNames: ownerInstalledNames(realCfg) });
    const verdict = { expect: 'fail', got: check.ok ? 'pass' : 'fail', problems: check.problems.length, pass: !check.ok };
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
  const init = JSON.parse(lines[0]);
  const verdict = {
    status: rec.status, init: rec.checks?.init?.ok, audit: rec.checks?.audit?.ok, readsDenied: reads.ok,
    builtIns: [...new Set([...(init.skills ?? []), ...(init.slash_commands ?? [])])].length,
    pass: rec.checks?.init?.ok === true && reads.ok && rec.status !== 'secret-redacted',
  };
  writeFileSync(join(outDir, 'verdict.json'), JSON.stringify({ ...verdict, missingDenials: reads.missing, allowedSkills: [...new Set([...(init.skills ?? []), ...(init.slash_commands ?? [])])] }, null, 2));
  console.log(JSON.stringify(verdict));
  process.exitCode = verdict.pass ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

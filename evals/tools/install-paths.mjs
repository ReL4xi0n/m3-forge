#!/usr/bin/env node
// Install paths, tried in a clean environment (plan "Release preparation" 6): a fresh CLAUDE_CONFIG_DIR
// with no other skills or plugins and the OAuth token only.
//   (a) plugin: `claude plugin marketplace add <source>` + `claude plugin install m3-forge@m3-forge`
//   (b) manual: copy plugin/skills/material3 to <config>/skills/material3
// Each path first records the session's init event (slash commands and skills seen), then, with --run,
// runs the skill on a small request through the command(s) named. Transcripts go to
// private/evals/install-paths/<stamp>/.
//   node evals/tools/install-paths.mjs plugin <marketplace source> [--run "/m3-forge:material3 ..."] [--run "/material3 ..."]
//   node evals/tools/install-paths.mjs manual <skill folder> [--run "/material3 ..."]
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { childEnv } from './isolation.mjs';
import { toolchainRoot } from './toolchain-env.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const token = () => readFileSync(join(toolchainRoot(), 'secrets', 'claude-oauth-token'), 'utf8').trim();
const [mode, source] = process.argv.slice(2);
const runs = process.argv.flatMap((a, i) => (a === '--run' ? [process.argv[i + 1]] : []));
if (!['plugin', 'manual'].includes(mode) || !source) { console.error('usage: install-paths.mjs plugin <source> | manual <skill folder> [--run "<prompt>"]...'); process.exit(2); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const base = join('C:\\m3-eval', 'install-paths', `${mode}-${stamp}`);
const cfg = join(base, 'cfg');
const evidence = join(root, 'private', 'evals', 'install-paths', `${mode}-${stamp}`);
mkdirSync(cfg, { recursive: true });
mkdirSync(evidence, { recursive: true });
writeFileSync(join(cfg, 'settings.json'), '{}');
const env = childEnv(process.env, { CLAUDE_CONFIG_DIR: cfg, CLAUDE_CODE_OAUTH_TOKEN: token() });
const cli = (args, cwd, timeout = 600000) => spawnSync('claude', args, { cwd, env, encoding: 'utf8', shell: true, timeout });
const quote = (s) => `"${s.replace(/"/g, '\\"')}"`;
const log = [];
const note = (k, v) => { log.push({ step: k, ...v }); console.log(k, JSON.stringify(v).slice(0, 400)); };

if (mode === 'plugin') {
  for (const a of [['plugin', 'marketplace', 'add', quote(source)], ['plugin', 'install', 'm3-forge@m3-forge']]) {
    const r = cli(a, base);
    note(a.slice(0, 2).join(' '), { status: r.status, out: (r.stdout + r.stderr).trim().slice(0, 1500) });
  }
} else {
  cpSync(source, join(cfg, 'skills', 'material3'), { recursive: true });
  note('copy', { to: join(cfg, 'skills', 'material3') });
}

const events = (stdout) => stdout.split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const flags = ['--output-format', 'stream-json', '--verbose', '--setting-sources', 'user', '--strict-mcp-config'];
{
  const work = join(base, 'probe'); mkdirSync(work, { recursive: true });
  const r = cli(['-p', quote('Reply with the single word OK. Do not use any tool.'), ...flags, '--max-turns', '1'], work);
  const init = events(r.stdout).find((e) => e.subtype === 'init');
  note('init', { slash: (init?.slash_commands ?? []).filter((n) => /material3|m3/.test(n)), skills: (init?.skills ?? []).filter((n) => /material3|m3/.test(n)), plugins: init?.plugins ?? [] });
}
runs.forEach((prompt, i) => {
  const work = join(base, `run${i + 1}`); mkdirSync(work, { recursive: true });
  const t0 = Date.now();
  const r = cli(['-p', quote(prompt), ...flags, '--permission-mode', 'acceptEdits', '--allowedTools', quote('Bash PowerShell Read Write Edit Glob Grep')], work, 45 * 60000);
  writeFileSync(join(evidence, `run${i + 1}.jsonl`), r.stdout ?? '');
  const ev = events(r.stdout ?? '');
  const res = ev.find((e) => e.type === 'result');
  const skillUsed = ev.some((e) => JSON.stringify(e).includes('SKILL.md') || JSON.stringify(e).includes('material3'));
  note(`run${i + 1}`, { prompt, status: r.status, minutes: +((Date.now() - t0) / 60000).toFixed(1), result: res?.subtype, cost: res?.total_cost_usd, skillUsed, reply: String(res?.result ?? '').slice(0, 1200), workDir: work });
});
writeFileSync(join(evidence, 'log.json'), JSON.stringify({ mode, source, stamp, base, log }, null, 2));
console.log('evidence', evidence);

#!/usr/bin/env node
// Pre-3b probes (measurement only). Isolated config folder + OAuth token as run-cell uses.
//   probe-skill-dir.mjs personal              stub skill installed as a personal skill
//   probe-skill-dir.mjs plugin <prompt...>    stub skill installed as a plugin from a local marketplace
//   probe-skill-dir.mjs tokens <base|refs|skill|checklist>   input-token total of a minimal run
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { childEnv } from './isolation.mjs';
import { toolchainRoot } from './toolchain-env.mjs';
import { DEFAULT_MODEL } from './run-cell.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EVAL = 'C:/m3-eval/probe-pre3b';
const STUB = ['---', 'name: material3', 'description: Stub skill for the skill-dir probe.', 'argument-hint: "<UI request>"',
  'disable-model-invocation: true', '---', '', 'Reply with exactly `DIR=${CLAUDE_SKILL_DIR}` and nothing else.', ''].join('\n');
const token = () => readFileSync(join(toolchainRoot(), 'secrets', 'claude-oauth-token'), 'utf8').trim();
const mkEnv = cfg => childEnv(process.env, { CLAUDE_CONFIG_DIR: cfg, CLAUDE_CODE_OAUTH_TOKEN: token() });
const cli = (args, env, cwd, input) => {
  const r = spawnSync('claude', args, { cwd, env, encoding: 'utf8', shell: true, input, timeout: 600000 });
  return r;
};
function fresh(name) {
  const base = join(EVAL, name, String(Date.now()));
  const cfg = join(base, 'cfg'); const work = join(base, 'work');
  mkdirSync(cfg, { recursive: true }); mkdirSync(work, { recursive: true });
  writeFileSync(join(cfg, 'settings.json'), '{}');
  return { base, cfg, work };
}
function summarize(stdout) {
  const ev = stdout.split(/\r?\n/).filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const res = ev.find(e => e.type === 'result');
  const init = ev.find(e => e.subtype === 'init');
  return { reply: res?.result, cost: res?.total_cost_usd, usage: res?.usage, slash: (init?.slash_commands ?? []).filter(n => /material3|m3/.test(n)), skills: (init?.skills ?? []).filter(n => /material3|m3/.test(n)), events: ev };
}
const base = ['--output-format', 'stream-json', '--verbose', '--model', DEFAULT_MODEL, '--setting-sources', 'user', '--strict-mcp-config', '--disallowedTools', 'Skill'];
const mode = process.argv[2];
const out = o => { const { events, ...rest } = o; console.log(JSON.stringify(rest, null, 1)); };

if (mode === 'personal') {
  const { cfg, work, base: b } = fresh('personal');
  const dir = join(cfg, 'skills', 'material3'); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'SKILL.md'), STUB);
  const s = summarize(cli(['-p', '/material3 go', ...base], mkEnv(cfg), work).stdout);
  out({ installedDir: dir, ...s });
  rmSync(b, { recursive: true, force: true });
} else if (mode === 'plugin') {
  const { cfg, work, base: b } = fresh('plugin');
  const mk = join(b, 'mk');
  mkdirSync(join(mk, '.claude-plugin'), { recursive: true });
  mkdirSync(join(mk, 'plugin', '.claude-plugin'), { recursive: true });
  mkdirSync(join(mk, 'plugin', 'skills', 'material3'), { recursive: true });
  cpSync(join(root, '.claude-plugin', 'marketplace.json'), join(mk, '.claude-plugin', 'marketplace.json'));
  cpSync(join(root, 'plugin', '.claude-plugin', 'plugin.json'), join(mk, 'plugin', '.claude-plugin', 'plugin.json'));
  writeFileSync(join(mk, 'plugin', 'skills', 'material3', 'SKILL.md'), STUB);
  const env = mkEnv(cfg);
  for (const a of [['plugin', 'marketplace', 'add', mk], ['plugin', 'install', 'm3-forge@m3-forge']]) {
    const r = cli(a, env, work); console.log(a.join(' '), '->', r.status, (r.stdout + r.stderr).trim().slice(0, 300));
  }
  const prompt = process.argv.slice(3).join(' ');
  const s = summarize(cli(['-p', prompt, ...base], env, work).stdout);
  out({ prompt, ...s });
  rmSync(b, { recursive: true, force: true });
} else if (mode === 'tokens') {
  const which = process.argv[3];
  const core = join(root, 'plugin', 'skills', 'material3');
  const files = ['color', 'typography', 'shape', 'layout', 'composition', 'icons', 'content', 'components'].map(n => join(core, 'references', 'core', `${n}.md`));
  let text = '';
  if (which === 'refs') text = files.map(f => readFileSync(f, 'utf8')).join('\n');
  if (which === 'skill') text = readFileSync(join(core, 'SKILL.md'), 'utf8');
  if (which === 'checklist') text = readFileSync(join(core, 'CHECKLIST.md'), 'utf8');
  const { cfg, work, base: b } = fresh('tokens');
  const prompt = `Reply with the single word OK. Do not use any tool.\n${text}`;
  const s = summarize(cli(['-p', ...base], mkEnv(cfg), work, prompt).stdout);
  const u = s.usage ?? {};
  const total = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
  out({ which, chars: text.length, usage: u, inputTotal: total, reply: s.reply, cost: s.cost });
  rmSync(b, { recursive: true, force: true });
}

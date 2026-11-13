import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { preflight, checkInit, auditTranscript, classifyEnd, childEnv, DISALLOWED_TOOLS } from '../isolation.mjs';

const here = dirname(fileURLToPath(import.meta.url));
// A real init event from Claude Code 2.1.322 with an empty config folder (no auth, no API call).
const raw = JSON.parse(readFileSync(join(here, 'fixtures', 'init-clean.json'), 'utf8'));
const WORK = String.raw`C:\m3-eval\probe\work`;
const CFG = String.raw`C:\m3-eval\probe\cfg`;
const clean = () => ({ ...structuredClone(raw), tools: raw.tools.filter(t => !DISALLOWED_TOOLS.includes(t)) });
const opts = { workDir: WORK, cfgDir: CFG, forbiddenNames: ['frontend-design', 'brainstorming'] };

test('checkInit: a clean init passes', () => {
  assert.deepEqual(checkInit(clean(), opts), { ok: true, problems: [] });
});

test('checkInit: each leak fails', () => {
  const cases = {
    mcp: i => { i.mcp_servers = [{ name: 'figma', status: 'connected' }]; },
    plugin: i => { i.plugins.push({ name: 'superpowers', path: String.raw`C:\x`, source: 'superpowers@claude-plugins-official' }); },
    namespaced: i => { i.skills.push('superpowers:brainstorming'); },
    owner: i => { i.skills.push('frontend-design'); },
    skillTool: i => { i.tools.push('Skill'); },
    mcpTool: i => { i.tools.push('mcp__claude_ai_Figma__use_figma'); },
    cwd: i => { i.cwd = String.raw`C:\Users\someone\Desktop\repo`; },
    memory: i => { i.memory_paths = { auto: String.raw`C:\Users\someone\.claude\projects\x\memory` }; },
    missing: i => { delete i.plugins; },
  };
  for (const [name, mutate] of Object.entries(cases)) {
    const i = clean();
    mutate(i);
    assert.equal(checkInit(i, opts).ok, false, name);
  }
  assert.equal(checkInit({ type: 'assistant' }, opts).ok, false, 'not an init event');
});

test('checkInit: with the canary list, an extra built-in name fails', () => {
  const i = clean();
  const allowedSkills = [...new Set([...i.skills, ...i.slash_commands])];
  assert.equal(checkInit(i, { ...opts, allowedSkills }).ok, true);
  i.slash_commands.push('new-thing');
  assert.equal(checkInit(i, { ...opts, allowedSkills }).ok, false);
});

test('preflight: planted ancestor CLAUDE.md, extra config file, forbidden env', () => {
  const base = mkdtempSync(join(tmpdir(), 'm3iso-'));
  const work = join(base, 'a', 'work');
  const cfg = join(base, 'cfg');
  mkdirSync(work, { recursive: true });
  mkdirSync(cfg);
  writeFileSync(join(cfg, 'settings.json'), '{}');
  const env = { CLAUDE_CONFIG_DIR: cfg, PATH: process.env.PATH };
  // The temp dir may sit under a folder with markers (a profile's .claude); count only new problems.
  const before = preflight({ workDir: work, cfgDir: cfg, env }).problems;
  writeFileSync(join(base, 'a', 'CLAUDE.md'), 'x');
  writeFileSync(join(cfg, '.credentials.json'), '{}');
  const after = preflight({ workDir: work, cfgDir: cfg, env: { ...env, ANTHROPIC_API_KEY: 'x' } });
  assert.equal(after.ok, false);
  const fresh = after.problems.filter(p => !before.includes(p));
  assert.ok(fresh.some(p => p.includes('CLAUDE.md')), 'ancestor CLAUDE.md');
  assert.ok(fresh.some(p => p.includes('.credentials.json')), 'unexpected config entry');
  assert.ok(fresh.some(p => p.includes('ANTHROPIC_API_KEY')), 'forbidden env');
});

test('childEnv: strips CLAUDE_/ANTHROPIC_/MCP_/npm_config_ and CLAUDECODE, then adds ours', () => {
  const e = childEnv({ PATH: 'p', CLAUDECODE: '1', CLAUDE_CODE_ENTRYPOINT: 'x', ANTHROPIC_API_KEY: 'k', npm_config_cache: 'c', MCP_TIMEOUT: '1' }, { CLAUDE_CONFIG_DIR: 'cfg' });
  assert.deepEqual(e, { PATH: 'p', CLAUDE_CONFIG_DIR: 'cfg' });
});

const toolUse = input => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read', input }] } });

test('auditTranscript: repo path, keyword and outside paths', () => {
  const o = {
    workDir: WORK,
    repoRoot: String.raw`C:\Users\someone\Desktop\repo`,
    forbiddenRoots: [String.raw`C:\Users\someone\.claude`],
    allowRoots: [String.raw`C:\tools`],
  };
  assert.equal(auditTranscript([toolUse({ file_path: String.raw`C:\m3-eval\probe\work\src\a.ts` })], o).ok, true);
  assert.equal(auditTranscript([toolUse({ file_path: String.raw`C:\Users\someone\Desktop\repo\knowledge\README.md` })], o).ok, false);
  assert.equal(auditTranscript([toolUse({ command: 'type C:/Users/someone/.claude/CLAUDE.md' })], o).ok, false);
  assert.equal(auditTranscript([toolUse({ command: 'git clone https://github.com/x/m3-forge' })], o).ok, false);
  const warn = auditTranscript([toolUse({ command: String.raw`dir D:\other` })], o);
  assert.equal(warn.ok, true);
  assert.equal(warn.hits[0].level, 'warn');
});

test('classifyEnd: ok, asked-question, session-error', () => {
  const a = content => JSON.stringify({ type: 'assistant', message: { content } });
  const result = (is_error = false) => JSON.stringify({ type: 'result', is_error });
  assert.equal(classifyEnd([a([{ type: 'tool_use', name: 'Write', input: {} }]), a([{ type: 'text', text: 'Done.' }]), result()]), 'ok');
  assert.equal(classifyEnd([a([{ type: 'text', text: 'Which framework should I use?' }]), result()]), 'asked-question');
  assert.equal(classifyEnd([a([{ type: 'text', text: 'x' }])]), 'session-error');
  assert.equal(classifyEnd([result(true)]), 'session-error');
});

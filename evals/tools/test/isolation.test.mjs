import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, win32 } from 'node:path';
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

test('effectiveForbidden: an owner skill that shares a name with a Claude Code built-in is not a leak', async () => {
  const { effectiveForbidden } = await import('../isolation.mjs');
  assert.deepEqual(effectiveForbidden(['design', 'frontend-design', 'brainstorming'], ['design', 'debug']), ['frontend-design', 'brainstorming']);
  const i = clean();
  i.skills.push('design');
  assert.equal(checkInit(i, { ...opts, forbiddenNames: effectiveForbidden(['design', 'frontend-design'], ['design']) }).ok, true);
  assert.equal(checkInit(i, { ...opts, forbiddenNames: ['design'] }).ok, false);
});

test('builtInNames: skills and slash commands of an init event', async () => {
  const { builtInNames } = await import('../isolation.mjs');
  assert.deepEqual(builtInNames({ skills: ['a', 'b'], slash_commands: ['b', 'c'] }), ['a', 'b', 'c']);
});

test('auditTranscript: a forbidden root with spaces in its path is still caught', () => {
  const o = { workDir: WORK, repoRoot: String.raw`C:\Users\someone\Desktop\My Repo 3`, forbiddenRoots: [String.raw`C:\Users\someone\.m3-toolchain\secrets`] };
  assert.equal(auditTranscript([toolUse({ file_path: String.raw`C:\Users\someone\Desktop\My Repo 3\knowledge\README.md` })], o).ok, false);
  assert.equal(auditTranscript([toolUse({ command: 'Get-Content "c:/users/someone/desktop/my repo 3/private/x.txt"' })], o).ok, false);
  assert.equal(auditTranscript([toolUse({ command: String.raw`type C:\Users\someone\.m3-toolchain\secrets\claude-oauth-token` })], o).ok, false);
});

test('findInit: the init event after hook events, and hook events are a leak', async () => {
  const { findInit } = await import('../isolation.mjs');
  const hook = JSON.stringify({ type: 'system', subtype: 'hook_started', hook_name: 'SessionStart' });
  const f = findInit([hook, hook, JSON.stringify(clean())]);
  assert.equal(f.init.subtype, 'init');
  assert.deepEqual(f.preInit, ['system/hook_started', 'system/hook_started']);
  assert.equal(checkInit(f.init, { ...opts, preInit: f.preInit }).ok, false, 'hooks ran before init');
  const g = findInit([JSON.stringify(clean())]);
  assert.equal(checkInit(g.init, { ...opts, preInit: g.preInit }).ok, true);
  assert.equal(findInit(['not json']).init, null);
});

test('preflight and dropRepoPaths: no environment value may point into the repository', async () => {
  const { dropRepoPaths } = await import('../isolation.mjs');
  const repoRoot = join(tmpdir(), 'My Repo 3');
  const env = { PATH: `${join(repoRoot, 'tools', 'shims')};${join(tmpdir(), 'bin')}`, INIT_CWD: repoRoot, KEEP: 'x' };
  const cleaned = dropRepoPaths(env, repoRoot);
  assert.equal(cleaned.INIT_CWD, undefined);
  assert.equal(cleaned.KEEP, 'x');
  assert.ok(!cleaned.PATH.toLowerCase().includes('my repo 3'), 'repo entries are removed from PATH');
  const base = mkdtempSync(join(tmpdir(), 'm3env-'));
  const work = join(base, 'w'); const cfg = join(base, 'c');
  mkdirSync(work); mkdirSync(cfg); writeFileSync(join(cfg, 'settings.json'), '{}');
  const p = preflight({ workDir: work, cfgDir: cfg, env: { CLAUDE_CONFIG_DIR: cfg, INIT_CWD: repoRoot }, checkAncestors: false, repoRoot });
  assert.ok(p.problems.some(x => x.includes('INIT_CWD')));
});

// ---- With-skill run mode (Phase 3, Task 2) ----

test('checkInit: a skill run accepts material3 on top of the built-ins, and nothing else', () => {
  const i = clean();
  const builtIns = [...new Set([...i.skills, ...i.slash_commands])];
  i.skills.push('material3');
  i.slash_commands.push('material3');
  assert.deepEqual(checkInit(i, { ...opts, allowedSkills: [...builtIns, 'material3'] }), { ok: true, problems: [] });
  assert.deepEqual(checkInit(structuredClone(i), { ...opts, allowedSkills: [...builtIns, 'material3'] }).ok, true);
  const other = structuredClone(i);
  other.skills.push('other');
  const r = checkInit(other, { ...opts, allowedSkills: [...builtIns, 'material3'] });
  assert.equal(r.ok, false);
  assert.ok(r.problems.some(p => p.includes('other')));
  // Without material3 in the allowed list, the name stays suspect.
  const base = checkInit(structuredClone(i), { ...opts, allowedSkills: builtIns });
  assert.ok(base.problems.some(p => p.includes('suspect skill or command: material3')), JSON.stringify(base.problems));
  assert.equal(checkInit(structuredClone(i), opts).ok, false, 'no allowed list: material3 is suspect');
  // The exemption is for material3 only, never for another suspect name.
  const sp = structuredClone(i);
  sp.skills.push('superpowers');
  assert.ok(checkInit(sp, { ...opts, allowedSkills: [...builtIns, 'material3', 'superpowers'] }).problems.some(p => p.includes('suspect skill or command: superpowers')));
});

test('checkInit: an init with only material3 passes when the allowed list is just material3', () => {
  const i = { ...clean(), skills: ['material3'], slash_commands: ['material3'] };
  assert.equal(checkInit(i, { ...opts, allowedSkills: ['material3'] }).ok, true);
  assert.equal(checkInit({ ...i, skills: ['material3', 'another'] }, { ...opts, allowedSkills: ['material3'] }).ok, false);
});

test('preflight: a skill run accepts settings.json and skills/material3/ only', () => {
  const base = mkdtempSync(join(tmpdir(), 'm3sk-'));
  const work = join(base, 'w'); const cfg = join(base, 'c');
  mkdirSync(work); mkdirSync(join(cfg, 'skills', 'material3'), { recursive: true });
  writeFileSync(join(cfg, 'settings.json'), '{}');
  writeFileSync(join(cfg, 'skills', 'material3', 'SKILL.md'), 'x');
  const env = { CLAUDE_CONFIG_DIR: cfg };
  const run = o => preflight({ workDir: work, cfgDir: cfg, env, checkAncestors: false, ...o });
  assert.deepEqual(run({ skills: ['material3'] }), { ok: true, problems: [] });
  assert.equal(run({}).ok, false, 'a baseline run must not have a skills folder');
  mkdirSync(join(cfg, 'skills', 'other'));
  const extra = run({ skills: ['material3'] });
  assert.equal(extra.ok, false);
  assert.ok(extra.problems.some(p => p.includes('other')), JSON.stringify(extra.problems));
  rmSync(join(cfg, 'skills', 'other'), { recursive: true });
  rmSync(join(cfg, 'skills', 'material3'), { recursive: true });
  assert.equal(run({ skills: ['material3'] }).ok, false, 'the skill folder must be there');
  writeFileSync(join(cfg, 'skills', 'material3'), 'not a folder');
  assert.equal(run({ skills: ['material3'] }).ok, false, 'the skill must be a folder');
});

test('auditTranscript: a skill run may use its installed skill folder, not the rest of the config folder', () => {
  const cfg = win32.join('C:\\', 'm3-eval', 'cfg', 's1', 'podcast-player.web.web-empty.default');
  const at = (...p) => win32.join(cfg, ...p);
  const o = { workDir: WORK, repoRoot: win32.join('C:\\', 'Users', 'someone', 'Desktop', 'repo'), allowRoots: [at('skills', 'material3')] };
  assert.deepEqual(auditTranscript([toolUse({ file_path: at('skills', 'material3', 'SKILL.md') })], o).hits, []);
  for (const p of [at('settings.json'), at('skills', 'material3x', 'SKILL.md'), at('skills', 'other', 'SKILL.md')]) {
    const r = auditTranscript([toolUse({ file_path: p })], o);
    assert.equal(r.hits.length, 1, p);
    assert.equal(r.hits[0].level, 'warn', p);
  }
});

// Isolation guarantees and checks for eval runs (Phase 2 plan, Task 4: G1–G6, V1–V3).
// Every check fails closed: a missing field or an unreadable folder is a problem, not a pass.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';

// Tools a run may not have: skills (G4), and tools that act outside the work folder or publish.
export const DISALLOWED_TOOLS = [
  'Skill', 'Artifact', 'DesignSync', 'CronCreate', 'CronDelete', 'CronList', 'ScheduleWakeup',
  'RemoteTrigger', 'PushNotification', 'SendMessage', 'ListAgents', 'Workflow', 'EnterWorktree',
  'ExitWorktree',
];
const ANCESTOR_MARKERS = ['CLAUDE.md', 'CLAUDE.local.md', 'AGENTS.md', '.claude', '.mcp.json', '.git'];
const FORBIDDEN_ENV = /^(CLAUDE|ANTHROPIC|MCP|npm_config)_|^CLAUDECODE$/i;
const SUSPECT_NAME = /superpowers|claude-mem|graphify|m3-forge|material3/i;

const norm = p => resolve(p).replace(/[\\/]+/g, '/').replace(/\/$/, '').toLowerCase();
const inside = (p, root) => { const a = norm(p); const b = norm(root); return a === b || a.startsWith(`${b}/`); };

// G6: the child's environment. Removes every CLAUDE_*/ANTHROPIC_*/MCP_*/npm_config_* key, then adds ours.
export function childEnv(base, add = {}) {
  const env = {};
  for (const [k, v] of Object.entries(base)) if (!FORBIDDEN_ENV.test(k)) env[k] = v;
  return { ...env, ...add };
}

// V1: before a run.
export function preflight({ workDir, cfgDir, env, allowedCfgFiles = ['settings.json'], checkAncestors = true }) {
  const problems = [];
  if (!existsSync(workDir)) problems.push(`work folder missing: ${workDir}`);
  for (let d = dirname(resolve(workDir)); checkAncestors; d = dirname(d)) {
    for (const m of ANCESTOR_MARKERS) if (existsSync(join(d, m))) problems.push(`ancestor marker ${m} in ${d}`);
    if (dirname(d) === d) break;
  }
  for (const m of ANCESTOR_MARKERS) if (existsSync(join(workDir, m))) problems.push(`marker ${m} inside the work folder`);
  try {
    execFileSync('git', ['rev-parse', '--git-dir'], { cwd: workDir, stdio: 'pipe' });
    problems.push('work folder is inside a git repository');
  } catch { /* expected: not a repository */ }
  if (!existsSync(cfgDir)) problems.push(`config folder missing: ${cfgDir}`);
  else {
    const extra = readdirSync(cfgDir).filter(f => !allowedCfgFiles.includes(f));
    if (extra.length) problems.push(`config folder holds unexpected entries: ${extra.join(', ')}`);
  }
  for (const k of Object.keys(env)) {
    if (FORBIDDEN_ENV.test(k) && !['CLAUDE_CONFIG_DIR', 'CLAUDE_CODE_OAUTH_TOKEN', 'npm_config_cache'].includes(k)) problems.push(`forbidden env key: ${k}`);
  }
  if (!env.CLAUDE_CONFIG_DIR || norm(env.CLAUDE_CONFIG_DIR) !== norm(cfgDir)) problems.push('CLAUDE_CONFIG_DIR is not the run config folder');
  return { ok: problems.length === 0, problems };
}

// V2: the run's own init event.
export function checkInit(init, { workDir, cfgDir, forbiddenNames = [], allowedSkills = null }) {
  const problems = [];
  if (!init || init.type !== 'system' || init.subtype !== 'init') return { ok: false, problems: ['first event is not system/init'] };
  for (const f of ['cwd', 'tools', 'mcp_servers', 'plugins', 'skills', 'slash_commands']) {
    if (init[f] === undefined) problems.push(`init has no ${f}`);
  }
  if (init.cwd && norm(init.cwd) !== norm(workDir)) problems.push(`cwd is ${init.cwd}`);
  if (Array.isArray(init.mcp_servers) && init.mcp_servers.length) problems.push(`MCP servers: ${init.mcp_servers.map(s => s.name ?? s).join(', ')}`);
  for (const t of init.tools ?? []) {
    if (DISALLOWED_TOOLS.includes(t)) problems.push(`disallowed tool present: ${t}`);
    if (t.startsWith('mcp__')) problems.push(`MCP tool present: ${t}`);
  }
  for (const p of init.plugins ?? []) {
    if (p.path !== 'builtin' || !String(p.source ?? '').endsWith('@builtin')) problems.push(`non-builtin plugin: ${p.name ?? JSON.stringify(p)}`);
  }
  const forbidden = new Set(forbiddenNames.map(n => n.toLowerCase()));
  for (const n of new Set([...(init.skills ?? []), ...(init.slash_commands ?? [])])) {
    if (n.includes(':')) problems.push(`namespaced skill or command: ${n}`);
    if (SUSPECT_NAME.test(n)) problems.push(`suspect skill or command: ${n}`);
    if (forbidden.has(n.toLowerCase())) problems.push(`owner-installed skill or command: ${n}`);
    if (allowedSkills && !allowedSkills.includes(n)) problems.push(`skill or command not in the canary's built-in list: ${n}`);
  }
  if (cfgDir && init.memory_paths?.auto && !inside(init.memory_paths.auto, cfgDir)) problems.push('auto-memory path is outside the run config folder');
  return { ok: problems.length === 0, problems };
}

// Owner-installed skill, plugin and command names, read from the real config (names only, kept private).
export function ownerInstalledNames(realCfgDir) {
  const names = new Set();
  const dirs = d => (existsSync(d) ? readdirSync(d).filter(f => { try { return statSync(join(d, f)).isDirectory(); } catch { return false; } }) : []);
  for (const s of dirs(join(realCfgDir, 'skills'))) names.add(s);
  for (const c of existsSync(join(realCfgDir, 'commands')) ? readdirSync(join(realCfgDir, 'commands')) : []) names.add(c.replace(/\.md$/, ''));
  const cache = join(realCfgDir, 'plugins', 'cache');
  for (const market of dirs(cache)) {
    for (const plugin of dirs(join(cache, market))) {
      names.add(plugin);
      for (const version of dirs(join(cache, market, plugin))) {
        for (const s of dirs(join(cache, market, plugin, version, 'skills'))) names.add(s);
      }
    }
  }
  return [...names].sort();
}

const ABS_PATH = /(?:[A-Za-z]:[\\/]|\/\/?[a-z]\/|\\\\)[^\s"'`<>|*?\r\n]*/g;

// V3: every tool call and tool result. 'fail' hits invalidate the run; 'warn' hits are listed.
export function auditTranscript(lines, { workDir, repoRoot, forbiddenRoots = [], allowRoots = [], keywords = ['m3-forge', 'reference-screenshots', 'holdout'] }) {
  const hits = [];
  const fail = [repoRoot, ...forbiddenRoots].filter(Boolean);
  const texts = [];
  for (const raw of lines) {
    let ev;
    try { ev = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { continue; }
    for (const c of ev?.message?.content ?? []) {
      if (c.type === 'tool_use') texts.push({ kind: 'tool_use', name: c.name, text: JSON.stringify(c.input ?? {}) });
      if (c.type === 'tool_result') texts.push({ kind: 'tool_result', text: typeof c.content === 'string' ? c.content : JSON.stringify(c.content ?? '') });
    }
  }
  for (const t of texts) {
    const text = t.text.replace(/\\\\/g, '\\');
    for (const k of keywords) if (text.toLowerCase().includes(k)) hits.push({ level: 'fail', why: `keyword ${k}`, where: t.kind });
    for (const m of text.match(ABS_PATH) ?? []) {
      const p = m.replace(/^\/\/?([a-z])\//, '$1:/');
      if (fail.some(r => inside(p, r))) hits.push({ level: 'fail', why: 'forbidden path', path: p, where: t.kind });
      else if (!inside(p, workDir) && !allowRoots.some(r => inside(p, r))) hits.push({ level: 'warn', why: 'path outside the work folder', path: p, where: t.kind });
    }
  }
  return { ok: !hits.some(h => h.level === 'fail'), hits };
}

// A run that ends with a question and never changed a file did not do the task.
export function classifyEnd(lines) {
  let wrote = false;
  let lastText = '';
  let result = null;
  for (const raw of lines) {
    let ev;
    try { ev = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { continue; }
    if (ev.type === 'result') result = ev;
    if (ev.type === 'assistant') {
      for (const c of ev.message?.content ?? []) {
        if (c.type === 'tool_use' && ['Write', 'Edit', 'NotebookEdit'].includes(c.name)) wrote = true;
        if (c.type === 'text' && c.text.trim()) lastText = c.text.trim();
      }
    }
  }
  if (!result) return 'session-error';
  if (result.is_error) return 'session-error';
  if (!wrote && /\?\s*$/.test(lastText)) return 'asked-question';
  return 'ok';
}

export { norm, inside, sep };

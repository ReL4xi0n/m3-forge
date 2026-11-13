// Blind judge (spec §12, Phase 2 plan Task 10): one fresh, isolated, read-only claude -p session per
// batch. Output is validated; an invalid batch is re-run with a fresh session at most twice, then failed.
import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { preflight, checkInit, childEnv, ownerInstalledNames, DISALLOWED_TOOLS } from './isolation.mjs';
import { settingsFor, restrictAcl, aclOwnerOnly, DEFAULT_MODEL } from './run-cell.mjs';
import { withToolchain, toolchainRoot } from './toolchain-env.mjs';
import { checkFrozen } from './frozen.mjs';

export const ITEMS = ['component-choice', 'hierarchy-typography', 'color-roles', 'shape-expressive',
  'spacing-layout', 'interaction-states', 'dark-mode', 'overall-polish'];
const JUDGE_DISALLOWED = ['Bash', 'PowerShell', 'Edit', 'Write', 'NotebookEdit', 'WebFetch', 'WebSearch', 'Agent', 'Task', ...DISALLOWED_TOOLS];

export function judgePrompt({ ids, root }) {
  const md = readFileSync(join(root, 'evals', 'judge.md'), 'utf8');
  const m = md.match(/````text\r?\n([\s\S]*?)\r?\n````/);
  if (!m) throw new Error('judge.md has no prompt block');
  const rubric = readFileSync(join(root, 'evals', 'rubric.md'), 'utf8').trim();
  return m[1].replace('{{IDS}}', ids.join(', ')).replace('{{RUBRIC}}', rubric);
}

export function validateScores(text, ids) {
  const problems = [];
  let arr;
  try {
    const s = String(text);
    arr = JSON.parse(s.slice(s.indexOf('['), s.lastIndexOf(']') + 1));
  } catch { return { ok: false, problems: ['reply is not a JSON array'], scores: null }; }
  if (!Array.isArray(arr)) return { ok: false, problems: ['reply is not a JSON array'], scores: null };
  const seen = new Set();
  for (const e of arr) {
    const key = `${e?.id}/${e?.item}`;
    if (!ids.includes(e?.id)) problems.push(`unknown id: ${e?.id}`);
    if (!ITEMS.includes(e?.item)) problems.push(`unknown item: ${e?.item}`);
    if (!Number.isInteger(e?.score) || e.score < 0 || e.score > 3) problems.push(`bad score for ${key}`);
    if (typeof e?.reason !== 'string' || !e.reason.trim()) problems.push(`no reason for ${key}`);
    if (seen.has(key)) problems.push(`duplicate ${key}`);
    seen.add(key);
  }
  for (const id of ids) for (const item of ITEMS) if (!seen.has(`${id}/${item}`)) problems.push(`missing ${id}/${item}`);
  return problems.length ? { ok: false, problems, scores: null } : { ok: true, problems: [], scores: arr };
}

function runOnce(cmd, args, { cwd, env }) {
  return new Promise(res => {
    const c = spawn(cmd, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const out = [];
    c.stdout.on('data', d => out.push(d));
    c.on('close', code => res({ code, lines: Buffer.concat(out).toString('utf8').split(/\r?\n/).filter(Boolean) }));
  });
}

// Copies only this batch's images, views, requests and the anchors into a fresh session folder.
function batchFolder(judgeDir, ids, dest) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  const views = JSON.parse(readFileSync(join(judgeDir, 'views.json'), 'utf8'));
  const requests = JSON.parse(readFileSync(join(judgeDir, 'requests.json'), 'utf8'));
  const pick = o => Object.fromEntries(ids.map(id => [id, o[id]]));
  writeFileSync(join(dest, 'views.json'), JSON.stringify(pick(views), null, 2));
  writeFileSync(join(dest, 'requests.json'), JSON.stringify(pick(requests), null, 2));
  for (const id of ids) for (const v of views[id] ?? []) cpSync(join(judgeDir, v.file), join(dest, v.file));
  if (existsSync(join(judgeDir, 'anchors'))) cpSync(join(judgeDir, 'anchors'), join(dest, 'anchors'), { recursive: true });
}

export async function runJudgeBatch(o) {
  const {
    judgeDir, ids, root, batchId, model = DEFAULT_MODEL, evalRoot = 'C:\\m3-eval',
    tokenFile = join(toolchainRoot(), 'secrets', 'claude-oauth-token'), claudeCmd = ['claude'],
    realCfg = join(process.env.USERPROFILE ?? process.env.HOME ?? '', '.claude'),
    requireFrozen = true, requireSecretsAcl = true, skipPreflightAncestors = false, retries = 2,
  } = o;
  if (requireFrozen) {
    const f = checkFrozen(root);
    if (!f.ok) return { ok: false, attempts: 0, scores: null, problems: f.problems };
  }
  if (requireSecretsAcl && !aclOwnerOnly(dirname(tokenFile)).ok) return { ok: false, attempts: 0, scores: null, problems: ['secrets folder ACL is not owner-only'] };
  const token = readFileSync(tokenFile, 'utf8').trim();
  const prompt = judgePrompt({ ids, root });
  const attemptsLog = [];
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const work = join(evalRoot, 'judge', `${batchId}-${attempt}`);
    const cfg = join(evalRoot, 'cfg', `judge-${batchId}-${attempt}`);
    batchFolder(judgeDir, ids, work);
    rmSync(cfg, { recursive: true, force: true });
    mkdirSync(cfg, { recursive: true });
    writeFileSync(join(cfg, 'settings.json'), JSON.stringify(settingsFor({ repoRoot: root, realCfg, secretsDir: dirname(tokenFile), cfgDir: cfg }), null, 2));
    restrictAcl(cfg);
    const env = withToolchain(childEnv(process.env, { CLAUDE_CONFIG_DIR: cfg, CLAUDE_CODE_OAUTH_TOKEN: token }));
    const pre = preflight({ workDir: work, cfgDir: cfg, env, checkAncestors: !skipPreflightAncestors });
    if (!pre.ok) { attemptsLog.push({ attempt, problems: pre.problems }); rmSync(cfg, { recursive: true, force: true }); continue; }
    const args = [...claudeCmd.slice(1), '-p', prompt, '--output-format', 'stream-json', '--verbose', '--model', model,
      '--setting-sources', 'user', '--strict-mcp-config', '--allowedTools', 'Read', '--disallowedTools', ...JUDGE_DISALLOWED];
    const r = await runOnce(claudeCmd[0], args, { cwd: work, env });
    rmSync(cfg, { recursive: true, force: true });
    const events = r.lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const init = checkInit(events[0], { workDir: work, cfgDir: cfg, forbiddenNames: ownerInstalledNames(realCfg) });
    const res = events.filter(e => e.type === 'result').pop();
    const v = init.ok ? validateScores(res?.result ?? '', ids) : { ok: false, problems: init.problems, scores: null };
    attemptsLog.push({ attempt, ok: v.ok, problems: v.problems.slice(0, 10), costUsd: res?.total_cost_usd ?? null, durationMs: res?.duration_ms ?? null });
    if (v.ok) return { ok: true, attempts: attempt, scores: v.scores, log: attemptsLog, model };
  }
  return { ok: false, attempts: retries + 1, scores: null, log: attemptsLog, model };
}

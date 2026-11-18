// One isolated, headless eval run (Phase 2 plan, Task 4). Every outcome returns a record; nothing is
// dropped silently. The token is read into the child's environment only and never printed.
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { preflight, dropRepoPaths, checkInit, auditTranscript, classifyEnd, childEnv, findInit, ownerInstalledNames, effectiveForbidden, probeBuiltIns, DISALLOWED_TOOLS, SKILL_UNDER_TEST } from './isolation.mjs';

let builtInCache = null;
export function forbiddenFor(realCfg, evalRoot, builtIns) {
  const owner = ownerInstalledNames(realCfg);
  if (!owner.length) return [];
  return effectiveForbidden(owner, builtIns ?? (builtInCache ??= probeBuiltIns(evalRoot)));
}
import { withToolchain, toolchainRoot } from './toolchain-env.mjs';
import { checkFrozen } from './frozen.mjs';
import { scanSecrets, redactSecrets } from '../../tools/guard/secrets.mjs';
import { decodeText } from '../../tools/guard/lib.mjs';

export const DEFAULT_MODEL = 'claude-opus-5-5';
export const ALLOWED_TOOLS = ['PowerShell', 'Bash', 'WebFetch', 'WebSearch', 'Task', 'Agent', 'TodoWrite'];
const SKIP_DIRS = new Set(['node_modules', 'build', 'dist', '.dart_tool', '.gradle', '.git', '.idea', '.kotlin']);
const PLATFORM = { web: 'web', flutter: 'Flutter', compose: 'Android (Jetpack Compose)' };

// A skill run sends the same prompt as the user-invoked slash command: `/material3 <prompt>`.
export function buildPrompt(cell, root, { skill = false } = {}) {
  const prompt = basePrompt(cell, root);
  return skill ? `/${SKILL_UNDER_TEST} ${prompt}` : prompt;
}

function basePrompt(cell, root) {
  const request = readFileSync(join(root, 'evals', cell.set === 'dev' ? 'dev' : 'prompts', `${cell.request}.md`), 'utf8').trim();
  const variants = readFileSync(join(root, 'evals', 'prompts', 'variants.md'), 'utf8');
  const kind = cell.variant.startsWith('seed:') ? 'seed' : cell.variant;
  const m = variants.match(new RegExp(`^- ${kind}: (.+)$`, 'm'));
  if (!m) throw new Error(`no style line for variant ${kind}`);
  let style = m[1].trim();
  if (kind === 'seed') style = style.replace(/#[0-9A-Fa-f]{6}/, cell.variant.slice(5));
  const where = cell.fixture === 'web-empty'
    ? `Platform: ${PLATFORM[cell.platform]}. The current folder is empty; create the project here.`
    : `Platform: ${PLATFORM[cell.platform]}. The project is in the current folder.`;
  return `${request}\n\n${style}\n\n${where}\n`;
}

const permPath = p => {
  const s = resolve(p).replace(/\\/g, '/');
  const m = s.match(/^([A-Za-z]):\/(.*)$/);
  return m ? `//${m[1].toLowerCase()}/${m[2]}`.replace(/\/$/, '') : s;
};

// Tools a run starts (the Dart analysis server, npm, Next.js telemetry) write to APPDATA/LOCALAPPDATA;
// point both into the run folder so nothing lands in the user profile (found in the pilot: Dart caches).
// TEMP/TMP get their own folder per run as well (owner, 2026-11-17: a baseline Flutter session wrote
// screenshots to the user temp folder, shared by every run).
export function sandboxEnv(env, dir) {
  const roaming = join(dir, 'Roaming');
  const local = join(dir, 'Local');
  const temp = join(dir, 'Temp');
  for (const d of [roaming, local, temp]) mkdirSync(d, { recursive: true });
  const out = { ...env };
  // Windows env keys are case-insensitive; drop any spelling of TEMP/TMP before setting them.
  for (const k of Object.keys(out)) if (/^(temp|tmp)$/i.test(k)) delete out[k];
  return { ...out, APPDATA: roaming, LOCALAPPDATA: local, TEMP: temp, TMP: temp };
}

// Characters a config entry name may hold; ignore-case matching covers upper case.
const NAME_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz_.-';

// Gitignore-style patterns for every name in a folder except `name`. Claude Code's deny rules win over
// allow rules and cannot be negated, so "everything but X" is spelled out: every shorter name, every
// longer name, and every name of the same length that differs in at least one position.
export function allNamesBut(name) {
  const n = name.toLowerCase();
  const out = [];
  for (let k = 1; k < n.length; k++) out.push('?'.repeat(k));
  out.push(`${'?'.repeat(n.length + 1)}*`);
  for (let i = 0; i < n.length; i++) {
    const cls = [...NAME_CHARS].filter(c => c !== n[i]).join('');
    out.push(`${'?'.repeat(i)}[${cls}]${'?'.repeat(n.length - i - 1)}`);
  }
  return out;
}

// skill: the name of the skill installed in <cfgDir>/skills/ for a skill run. The run may then read
// that folder (the skill reads its own files through ${CLAUDE_SKILL_DIR}); every other entry of the run
// config folder (settings.json, credentials, transcripts) stays unreadable, and nothing in it writable.
export function settingsFor({ repoRoot, realCfg, secretsDir, cfgDir, skill = null }) {
  const deny = [];
  for (const p of [repoRoot, realCfg, secretsDir, cfgDir].filter(Boolean)) {
    for (const tool of ['Read', 'Edit', 'Write']) {
      if (skill && p === cfgDir && tool === 'Read') {
        const c = permPath(cfgDir);
        for (const q of allNamesBut('skills')) deny.push(`Read(${c}/${q})`);
        for (const q of allNamesBut(skill)) deny.push(`Read(${c}/skills/${q})`);
        continue;
      }
      deny.push(`${tool}(${permPath(p)}/**)`);
    }
  }
  if (!skill) return { permissions: { deny }, enabledPlugins: {} };
  return { permissions: { allow: [`Read(${permPath(join(cfgDir, 'skills', skill))}/**)`], deny }, enabledPlugins: {} };
}

const isFile = p => { try { return statSync(p).isFile(); } catch { return false; } };
const pathKey = env => Object.keys(env).find(k => k.toLowerCase() === 'path') ?? 'PATH';

// noNode runs: every PATH folder that holds a JavaScript runtime (node, bun or deno, as an executable or
// a .cmd/.bat shim) is removed, so a tool the session starts can run no script. Other folders (the
// toolchain's Flutter and Java among them) stay, in order.
const JS_RUNTIMES = ['node', 'bun', 'deno'].flatMap(n => [n, `${n}.exe`, `${n}.cmd`, `${n}.bat`]);
export function withoutNode(env) {
  const key = pathKey(env);
  const keep = String(env[key] ?? '').split(';').filter(d => d && !JS_RUNTIMES.some(f => isFile(join(d.replace(/^"|"$/g, ''), f))));
  return { ...env, [key]: keep.join(';') };
}

// The command as the parent's PATH resolves it (Windows: the .exe), so a child PATH without some folder
// still starts the same `claude`. An absolute or unresolvable command is returned unchanged.
export function resolveCommand(cmd, env = process.env) {
  if (isAbsolute(cmd)) return cmd;
  const exts = process.platform === 'win32' ? ['.exe'] : [''];
  for (const d of String(env[pathKey(env)] ?? '').split(process.platform === 'win32' ? ';' : ':')) {
    for (const e of exts) if (d && isFile(join(d, `${cmd}${e}`))) return join(d, `${cmd}${e}`);
  }
  return cmd;
}

function whoami() {
  return execFileSync('whoami', { encoding: 'utf8' }).trim().toLowerCase();
}

export function restrictAcl(dir) {
  if (process.platform !== 'win32') return;
  execFileSync('icacls', [dir, '/inheritance:r', '/grant:r', `${whoami()}:(OI)(CI)F`], { stdio: 'pipe' });
}

// ok when the folder has exactly one ACE, for the current user, and nothing inherited.
export function aclOwnerOnly(dir) {
  if (process.platform !== 'win32') return { ok: true, aces: [] };
  const ps = `$a = (Get-Acl -LiteralPath $env:M3_ACL_DIR).Access | ForEach-Object { [pscustomobject]@{ who = $_.IdentityReference.Value; inherited = $_.IsInherited } }; ConvertTo-Json -InputObject @($a) -Compress`;
  const out = execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], { encoding: 'utf8', env: { ...process.env, M3_ACL_DIR: dir } });
  const aces = JSON.parse(out.trim() || '[]');
  const me = whoami();
  const mine = w => { const x = String(w).toLowerCase(); return x === me || x.endsWith(`\\${me.split('\\').pop()}`); };
  const ok = aces.length > 0 && aces.every(a => mine(a.who) && !a.inherited);
  return { ok, aces: aces.map(a => `${a.who}${a.inherited ? ' (inherited)' : ''}`) };
}

const sha = buf => createHash('sha256').update(buf).digest('hex');
function hashTree(dir) {
  const set = new Set();
  if (!existsSync(dir)) return set;
  const walk = d => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : set.add(sha(readFileSync(p))); } };
  walk(dir);
  return set;
}

// Copies a run folder into the private repo, scanning every text file for secrets first.
// Files byte-identical to the fixture are skipped: they are public already and carry no run output.
export function copyRunScanned(src, dst, { literals = [], skipSameAs = null, skipAssetsOf = null } = {}) {
  const assetHashes = skipAssetsOf ? hashTree(join(skipAssetsOf, 'assets')) : null;
  const redacted = [];
  let files = 0;
  let unchanged = 0;
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p); continue; }
      const rel = relative(src, p).replace(/\\/g, '/');
      const out = join(dst, rel);
      mkdirSync(dirname(out), { recursive: true });
      const buf = readFileSync(p);
      if (skipSameAs) {
        const orig = join(skipSameAs, rel);
        if (existsSync(orig) && readFileSync(orig).equals(buf)) { unchanged++; continue; }
      }
      if (assetHashes && assetHashes.has(sha(buf))) { unchanged++; continue; }
      const text = decodeText(buf);
      if (text != null && scanSecrets(text, { literals }).length) {
        const hits = scanSecrets(text, { literals });
        writeFileSync(out, redactSecrets(text, { literals }).text);
        redacted.push({ path: rel, count: hits.length, rules: [...new Set(hits.map(h => h.rule))] });
      } else writeFileSync(out, buf);
      files++;
    }
  };
  walk(src);
  return { files, redacted, unchanged };
}

function runProcess(cmd, args, { cwd, env, timeoutMs, logFile }) {
  return new Promise(resolvePromise => {
    const child = spawn(cmd, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const chunks = [];
    const err = [];
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    child.stdout.on('data', d => chunks.push(d));
    child.stderr.on('data', d => err.push(d));
    child.on('close', code => {
      clearTimeout(timer);
      const text = Buffer.concat(chunks).toString('utf8');
      writeFileSync(logFile, text);
      resolvePromise({ code, timedOut, lines: text.split(/\r?\n/).filter(Boolean), stderr: Buffer.concat(err).toString('utf8') });
    });
  });
}

export async function runCell(o) {
  const {
    cell, runId, root, model = DEFAULT_MODEL,
    evalRoot = 'C:\\m3-eval', fixtureDir, prepare = null,
    privateDir = join(root, 'private', 'evals', 'runs'),
    tokenFile = join(toolchainRoot(), 'secrets', 'claude-oauth-token'),
    claudeCmd = ['claude'], repoRoot = root,
    realCfg = join(process.env.USERPROFILE ?? process.env.HOME ?? '', '.claude'),
    requireFrozen = true, requireSecretsAcl = true, skipPreflightAncestors = false,
    allowedSkills = null, timeoutMs = 45 * 60 * 1000, kind = 'cell',
    // Skill run (Phase 3): skillDir is copied to <cfgDir>/skills/material3/ and the prompt is the
    // /material3 slash command. noNode: no PATH folder holding node reaches the session's tools.
    skillDir = null, noNode = false,
  } = o;
  const skill = skillDir ? SKILL_UNDER_TEST : null;
  const startedAt = new Date().toISOString();
  const record = (status, extra = {}) => ({ cell: cell.cell, runId, kind, model, status, startedAt, endedAt: new Date().toISOString(), ...extra });
  // The skill never sees an eval request (it would learn the eval's answers). A given prompt
  // (canaries, wording micro-tests) sends no request, so it is allowed.
  if (skill && cell.set !== 'dev' && o.promptOverride == null) return record('refused', { problems: ['eval cell with skill: only dev cells run with the skill'] });

  const frozen = requireFrozen ? checkFrozen(root) : { ok: true, skipped: true };
  if (!frozen.ok) return record('not-frozen', { problems: frozen.problems });

  const workDir = join(evalRoot, 'work', runId, cell.cell);
  const cfgDir = join(evalRoot, 'cfg', runId, cell.cell);
  const logDir = join(evalRoot, 'logs', runId, cell.cell);
  const secretsDir = dirname(tokenFile);
  for (const d of [workDir, cfgDir, logDir]) { rmSync(d, { recursive: true, force: true }); mkdirSync(d, { recursive: true }); }
  if (fixtureDir) cpSync(fixtureDir, workDir, { recursive: true });
  if (prepare) await prepare(workDir);
  const skillInstall = skill ? join(cfgDir, 'skills', skill) : null;
  if (skill) cpSync(skillDir, skillInstall, { recursive: true });
  writeFileSync(join(cfgDir, 'settings.json'), JSON.stringify(settingsFor({ repoRoot, realCfg, secretsDir, cfgDir, skill }), null, 2));
  restrictAcl(cfgDir);

  const checks = {};
  if (requireSecretsAcl) {
    checks.secretsAcl = aclOwnerOnly(secretsDir);
    if (!checks.secretsAcl.ok) return record('invalid-isolation', { checks });
  }
  if (!existsSync(tokenFile)) return record('no-token', { problems: [`token file missing: ${tokenFile}`] });
  const token = readFileSync(tokenFile, 'utf8').trim();
  const sandboxDir = join(evalRoot, 'appdata', runId, cell.cell);
  let env = sandboxEnv(dropRepoPaths(withToolchain(childEnv(process.env, { CLAUDE_CONFIG_DIR: cfgDir, CLAUDE_CODE_OAUTH_TOKEN: token })), repoRoot), sandboxDir);
  if (noNode) env = withoutNode(env);

  checks.preflight = preflight({ workDir, cfgDir, env, checkAncestors: !skipPreflightAncestors, repoRoot, skills: skill ? [skill] : [] });
  if (!checks.preflight.ok) { rmSync(cfgDir, { recursive: true, force: true }); return record('invalid-isolation', { checks }); }

  // The Skill tool stays disallowed in skill runs too: a user-typed slash command loads the skill
  // without it (canary, 2026-11-17), and disable-model-invocation keeps the model from calling it.
  const args = [...claudeCmd.slice(1), '-p', o.promptOverride ?? buildPrompt(cell, root, { skill: Boolean(skill) }),
    '--output-format', 'stream-json', '--verbose', '--model', model,
    '--setting-sources', 'user', '--strict-mcp-config', '--permission-mode', 'acceptEdits',
    '--allowedTools', ...ALLOWED_TOOLS, '--disallowedTools', ...DISALLOWED_TOOLS];
  // With noNode the child PATH may lack folders the parent has; start the parent's `claude`.
  const cmd = noNode ? resolveCommand(claudeCmd[0], process.env) : claudeCmd[0];
  const p = await runProcess(cmd, args, { cwd: workDir, env, timeoutMs, logFile: join(logDir, 'run.jsonl') });
  rmSync(cfgDir, { recursive: true, force: true });
  try { if (readdirSync(dirname(cfgDir)).length === 0) rmSync(dirname(cfgDir), { recursive: true }); } catch { /* already gone */ }

  const { init, preInit } = findInit(p.lines);
  // A skill run expects the skill under test on top of the allowed list (the canary's built-ins); an
  // owner install of the same name is not a leak here, since the run config folder holds our copy.
  const forbidden = forbiddenFor(realCfg, evalRoot, o.builtIns).filter(n => !skill || n !== skill);
  const allowed = skill ? [...new Set([...(allowedSkills ?? []), skill])] : allowedSkills;
  checks.init = checkInit(init, { workDir, cfgDir, forbiddenNames: forbidden, allowedSkills: allowed, preInit });
  checks.audit = auditTranscript(p.lines, {
    workDir, repoRoot, forbiddenRoots: [realCfg, secretsDir],
    // The run's own TEMP is allowed; the user temp folder (tmpdir()) no longer is, so a path there
    // shows up as a warning. A skill run may also use its installed skill folder.
    allowRoots: [toolchainRoot(), env.TEMP, join(evalRoot, 'work', runId), ...(skillInstall ? [skillInstall] : [])],
  });
  const end = p.timedOut ? 'timeout' : classifyEnd(p.lines);
  const res = p.lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(e => e?.type === 'result').pop() ?? null;

  const dest = join(privateDir, runId, cell.cell);
  rmSync(dest, { recursive: true, force: true });
  const logs = copyRunScanned(logDir, dest, { literals: [token] });
  const project = copyRunScanned(workDir, join(dest, 'project'), { literals: [token], skipSameAs: join(root, 'evals', 'fixtures', cell.fixture), skipAssetsOf: skill ? skillDir : null });
  checks.secrets = { redacted: [...logs.redacted, ...project.redacted.map(r => ({ ...r, path: `project/${r.path}` }))] };

  let status = end;
  if (checks.secrets.redacted.length) status = 'secret-redacted';
  if (!checks.init.ok || !checks.audit.ok) status = 'invalid-isolation';
  const rec = record(status, {
    durationMs: res?.duration_ms ?? null, costUsd: res?.total_cost_usd ?? null, usage: res?.usage ?? null,
    resultText: res?.is_error ? String(res.result ?? res.subtype ?? '').slice(0, 500) : null,
    claudeVersion: init?.claude_code_version ?? null, exitCode: p.code, workDir, checks,
    ...(skill || noNode ? { skill, noNode } : {}),
  });
  writeFileSync(join(dest, 'meta.json'), JSON.stringify({ ...rec, checks: undefined }, null, 2));
  writeFileSync(join(dest, 'checks.json'), JSON.stringify(checks, null, 2));
  return rec;
}

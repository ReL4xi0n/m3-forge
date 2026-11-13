// One isolated, headless eval run (Phase 2 plan, Task 4). Every outcome returns a record; nothing is
// dropped silently. The token is read into the child's environment only and never printed.
import { spawn, execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { preflight, checkInit, auditTranscript, classifyEnd, childEnv, ownerInstalledNames, DISALLOWED_TOOLS } from './isolation.mjs';
import { withToolchain, toolchainRoot } from './toolchain-env.mjs';
import { checkFrozen } from './frozen.mjs';
import { scanSecrets, redactSecrets } from '../../tools/guard/secrets.mjs';
import { decodeText } from '../../tools/guard/lib.mjs';

export const DEFAULT_MODEL = 'claude-opus-5-5';
export const ALLOWED_TOOLS = ['PowerShell', 'Bash', 'WebFetch', 'WebSearch', 'Task', 'Agent', 'TodoWrite'];
const SKIP_DIRS = new Set(['node_modules', 'build', 'dist', '.dart_tool', '.gradle', '.git', '.idea', '.kotlin']);
const PLATFORM = { web: 'web', flutter: 'Flutter', compose: 'Android (Jetpack Compose)' };

export function buildPrompt(cell, root) {
  const request = readFileSync(join(root, 'evals', 'prompts', `${cell.request}.md`), 'utf8').trim();
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

export function settingsFor({ repoRoot, realCfg, secretsDir, cfgDir }) {
  const deny = [];
  for (const p of [repoRoot, realCfg, secretsDir, cfgDir].filter(Boolean)) {
    for (const tool of ['Read', 'Edit', 'Write']) deny.push(`${tool}(${permPath(p)}/**)`);
  }
  return { permissions: { deny }, enabledPlugins: {} };
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

// Copies a run folder into the private repo, scanning every text file for secrets first.
export function copyRunScanned(src, dst, { literals = [] } = {}) {
  const redacted = [];
  let files = 0;
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p); continue; }
      const rel = relative(src, p).replace(/\\/g, '/');
      const out = join(dst, rel);
      mkdirSync(dirname(out), { recursive: true });
      const buf = readFileSync(p);
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
  return { files, redacted };
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
  } = o;
  const startedAt = new Date().toISOString();
  const record = (status, extra = {}) => ({ cell: cell.cell, runId, kind, model, status, startedAt, endedAt: new Date().toISOString(), ...extra });

  const frozen = requireFrozen ? checkFrozen(root) : { ok: true, skipped: true };
  if (!frozen.ok) return record('not-frozen', { problems: frozen.problems });

  const workDir = join(evalRoot, 'work', runId, cell.cell);
  const cfgDir = join(evalRoot, 'cfg', runId, cell.cell);
  const logDir = join(evalRoot, 'logs', runId, cell.cell);
  const secretsDir = dirname(tokenFile);
  for (const d of [workDir, cfgDir, logDir]) { rmSync(d, { recursive: true, force: true }); mkdirSync(d, { recursive: true }); }
  if (fixtureDir) cpSync(fixtureDir, workDir, { recursive: true });
  if (prepare) await prepare(workDir);
  writeFileSync(join(cfgDir, 'settings.json'), JSON.stringify(settingsFor({ repoRoot, realCfg, secretsDir, cfgDir }), null, 2));
  restrictAcl(cfgDir);

  const checks = {};
  if (requireSecretsAcl) {
    checks.secretsAcl = aclOwnerOnly(secretsDir);
    if (!checks.secretsAcl.ok) return record('invalid-isolation', { checks });
  }
  if (!existsSync(tokenFile)) return record('no-token', { problems: [`token file missing: ${tokenFile}`] });
  const token = readFileSync(tokenFile, 'utf8').trim();
  const env = withToolchain(childEnv(process.env, { CLAUDE_CONFIG_DIR: cfgDir, CLAUDE_CODE_OAUTH_TOKEN: token }));

  checks.preflight = preflight({ workDir, cfgDir, env, checkAncestors: !skipPreflightAncestors });
  if (!checks.preflight.ok) { rmSync(cfgDir, { recursive: true, force: true }); return record('invalid-isolation', { checks }); }

  const args = [...claudeCmd.slice(1), '-p', o.promptOverride ?? buildPrompt(cell, root),
    '--output-format', 'stream-json', '--verbose', '--model', model,
    '--setting-sources', 'user', '--strict-mcp-config', '--permission-mode', 'acceptEdits',
    '--allowedTools', ...ALLOWED_TOOLS, '--disallowedTools', ...DISALLOWED_TOOLS];
  const p = await runProcess(claudeCmd[0], args, { cwd: workDir, env, timeoutMs, logFile: join(logDir, 'run.jsonl') });
  rmSync(cfgDir, { recursive: true, force: true });
  try { if (readdirSync(dirname(cfgDir)).length === 0) rmSync(dirname(cfgDir), { recursive: true }); } catch { /* already gone */ }

  let init = null;
  try { init = JSON.parse(p.lines[0] ?? 'null'); } catch { init = null; }
  checks.init = checkInit(init, { workDir, cfgDir, forbiddenNames: ownerInstalledNames(realCfg), allowedSkills });
  checks.audit = auditTranscript(p.lines, {
    workDir, repoRoot, forbiddenRoots: [realCfg, secretsDir],
    allowRoots: [toolchainRoot(), tmpdir(), join(evalRoot, 'work', runId)],
  });
  const end = p.timedOut ? 'timeout' : classifyEnd(p.lines);
  const res = p.lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(e => e?.type === 'result').pop() ?? null;

  const dest = join(privateDir, runId, cell.cell);
  rmSync(dest, { recursive: true, force: true });
  const logs = copyRunScanned(logDir, dest, { literals: [token] });
  const project = copyRunScanned(workDir, join(dest, 'project'), { literals: [token] });
  checks.secrets = { redacted: [...logs.redacted, ...project.redacted.map(r => ({ ...r, path: `project/${r.path}` }))] };

  let status = end;
  if (checks.secrets.redacted.length) status = 'secret-redacted';
  if (!checks.init.ok || !checks.audit.ok) status = 'invalid-isolation';
  const rec = record(status, {
    durationMs: res?.duration_ms ?? null, costUsd: res?.total_cost_usd ?? null, usage: res?.usage ?? null,
    claudeVersion: init?.claude_code_version ?? null, exitCode: p.code, workDir, checks,
  });
  writeFileSync(join(dest, 'meta.json'), JSON.stringify({ ...rec, checks: undefined }, null, 2));
  writeFileSync(join(dest, 'checks.json'), JSON.stringify(checks, null, 2));
  return rec;
}

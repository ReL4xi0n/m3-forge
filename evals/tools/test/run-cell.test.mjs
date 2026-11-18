import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildPrompt, settingsFor, copyRunScanned, runCell, aclOwnerOnly, restrictAcl } from '../run-cell.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const fakeToken = 'sk-ant-' + 'oat01-' + 'Q7w8E9r0'.repeat(6);

test('buildPrompt: request, style line for the variant, platform line', () => {
  const p = buildPrompt({ request: 'settings', platform: 'flutter', fixture: 'flutter-material_ui', variant: 'classic' }, root);
  assert.match(p, /^# Settings screen/);
  assert.match(p, /Use the classic Material 3 style, not M3 Expressive\./);
  assert.match(p, /Platform: Flutter\. The project is in the current folder\.\s*$/);
  const s = buildPrompt({ request: 'dashboard', platform: 'web', fixture: 'web-empty', variant: 'seed:#B5651D' }, root);
  assert.match(s, /#B5651D as the brand color/);
  assert.match(s, /Platform: web\. The current folder is empty; create the project here\.\s*$/);
});

test('settingsFor: denies the repo, the real config, the secrets folder and the run config', { skip: process.platform !== 'win32' && 'Windows-only runner' }, () => {
  const s = settingsFor({ repoRoot: 'C:/r/repo', realCfg: 'C:/u/.claude', secretsDir: 'C:/u/.m3-toolchain/secrets', cfgDir: 'C:/m3-eval/cfg/x' });
  const deny = s.permissions.deny.join('\n');
  for (const p of ['//c/r/repo/**', '//c/u/.claude/**', '//c/u/.m3-toolchain/secrets/**', '//c/m3-eval/cfg/x/**']) {
    for (const tool of ['Read', 'Edit', 'Write']) assert.ok(deny.includes(`${tool}(${p})`), `${tool}(${p})`);
  }
  assert.equal(s.apiKeyHelper, undefined);
  assert.deepEqual(s.enabledPlugins ?? {}, {});
});

test('copyRunScanned: redacts tokens, skips dependency folders, never copies the secret', () => {
  const src = mkdtempSync(join(tmpdir(), 'm3run-'));
  const dst = mkdtempSync(join(tmpdir(), 'm3dst-'));
  writeFileSync(join(src, 'run.jsonl'), `{"tool_result":"CLAUDE_CODE_OAUTH_TOKEN=${fakeToken}"}\n`);
  mkdirSync(join(src, 'node_modules', 'x'), { recursive: true });
  writeFileSync(join(src, 'node_modules', 'x', 'a.js'), 'x');
  writeFileSync(join(src, 'index.html'), '<p>hi</p>');
  const r = copyRunScanned(src, dst, { literals: [fakeToken] });
  assert.equal(r.redacted.length, 1);
  assert.equal(r.redacted[0].path, 'run.jsonl');
  const copied = readFileSync(join(dst, 'run.jsonl'), 'utf8');
  assert.ok(!copied.includes(fakeToken));
  assert.match(copied, /\[REDACTED:/);
  assert.ok(!existsSync(join(dst, 'node_modules')));
  assert.ok(existsSync(join(dst, 'index.html')));
});

test('aclOwnerOnly: false before restricting, true after (Windows)', { skip: process.platform !== 'win32' }, () => {
  const d = mkdtempSync(join(tmpdir(), 'm3acl-'));
  assert.equal(aclOwnerOnly(d).ok, false, 'inherited ACEs are present');
  restrictAcl(d);
  assert.equal(aclOwnerOnly(d).ok, true);
});

// A stand-in for `claude` that prints a canned stream-json session.
function fakeClaude(dir, events) {
  const f = join(dir, 'fake-claude.mjs');
  writeFileSync(f, `const ev = ${JSON.stringify(events)};\nfor (const e of ev) { if (e === 'ENV') { process.stdout.write(JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', content: 'token=' + process.env.CLAUDE_CODE_OAUTH_TOKEN }] } }) + '\\n'); continue; } if (e.type === 'system') e.cwd = process.cwd(); if (e.type === 'system') e.memory_paths = { auto: process.env.CLAUDE_CONFIG_DIR + '/projects/m' }; process.stdout.write(JSON.stringify(e) + '\\n'); }\n`);
  return [process.execPath, f];
}

function setup() {
  const base = mkdtempSync(join(tmpdir(), 'm3cell-'));
  const fixture = join(base, 'fixture');
  mkdirSync(fixture);
  writeFileSync(join(fixture, 'README.txt'), 'fixture');
  const tokenFile = join(base, 'token');
  writeFileSync(tokenFile, fakeToken);
  return { base, fixture, tokenFile };
}

const init = { type: 'system', subtype: 'init', tools: ['Read', 'Write'], mcp_servers: [], plugins: [], skills: [], slash_commands: [] };
const result = { type: 'result', is_error: false, duration_ms: 1234, total_cost_usd: 0.5, usage: { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 30, cache_creation_input_tokens: 0 } };

test('runCell: a clean session is ok, records usage and copies a scanned run', async () => {
  const { base, fixture, tokenFile } = setup();
  const r = await runCell({
    cell: { cell: 'settings.web.web-empty.default', request: 'settings', platform: 'web', fixture: 'web-empty', variant: 'default' },
    runId: 't1', root, evalRoot: join(base, 'eval'), fixtureDir: fixture, privateDir: join(base, 'private'),
    tokenFile, claudeCmd: fakeClaude(base, [init, { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: 'index.html' } }] } }, result]),
    repoRoot: root, realCfg: join(base, 'no-real-cfg'), requireFrozen: false, skipPreflightAncestors: true, requireSecretsAcl: false,
  });
  assert.equal(r.status, 'ok', JSON.stringify(r.checks));
  assert.equal(r.durationMs, 1234);
  assert.equal(r.costUsd, 0.5);
  assert.equal(r.usage.output_tokens, 20);
  assert.ok(existsSync(join(base, 'private', 't1', 'settings.web.web-empty.default', 'run.jsonl')));
  assert.ok(!existsSync(join(base, 'eval', 'cfg', 't1')), 'the run config folder is removed afterwards');
});

test('runCell: a session that prints the token is redacted and flagged', async () => {
  const { base, fixture, tokenFile } = setup();
  const r = await runCell({
    cell: { cell: 'c', request: 'settings', platform: 'web', fixture: 'web-empty', variant: 'default' },
    runId: 't2', root, evalRoot: join(base, 'eval'), fixtureDir: fixture, privateDir: join(base, 'private'),
    tokenFile, claudeCmd: fakeClaude(base, [init, 'ENV', result]),
    repoRoot: root, realCfg: join(base, 'no-real-cfg'), requireFrozen: false, skipPreflightAncestors: true, requireSecretsAcl: false,
  });
  assert.equal(r.status, 'secret-redacted');
  const dir = join(base, 'private', 't2', 'c');
  const all = readdirSync(dir, { recursive: true }).map(f => join(dir, f)).filter(f => !f.endsWith('project'))
    .map(f => { try { return readFileSync(f, 'utf8'); } catch { return ''; } }).join('\n');
  assert.match(all, /\[REDACTED:/);
  assert.ok(!all.includes(fakeToken));
});

test('runCell: a leaky init makes the run invalid; a missing result is a session error', async () => {
  const { base, fixture, tokenFile } = setup();
  const leaky = { ...init, mcp_servers: [{ name: 'figma' }] };
  const common = { root, evalRoot: join(base, 'eval'), fixtureDir: fixture, privateDir: join(base, 'private'), tokenFile, repoRoot: root, realCfg: join(base, 'no'), requireFrozen: false, skipPreflightAncestors: true, requireSecretsAcl: false };
  const cell = { cell: 'c', request: 'settings', platform: 'web', fixture: 'web-empty', variant: 'default' };
  assert.equal((await runCell({ ...common, cell, runId: 't3', claudeCmd: fakeClaude(base, [leaky, result]) })).status, 'invalid-isolation');
  assert.equal((await runCell({ ...common, cell, runId: 't4', claudeCmd: fakeClaude(base, [init]) })).status, 'session-error');
});

test('runCell: refuses to start without a valid freeze unless told otherwise', async () => {
  const { base, fixture, tokenFile } = setup();
  const r = await runCell({
    cell: { cell: 'c', request: 'settings', platform: 'web', fixture: 'web-empty', variant: 'default' },
    runId: 't5', root: base, evalRoot: join(base, 'eval'), fixtureDir: fixture, privateDir: join(base, 'private'),
    tokenFile, claudeCmd: fakeClaude(base, [init, result]), repoRoot: root, realCfg: join(base, 'no'), skipPreflightAncestors: true, requireSecretsAcl: false,
  });
  assert.equal(r.status, 'not-frozen');
});

test('sandboxEnv: APPDATA and LOCALAPPDATA point into the run folder, so tools a run starts write nothing to the profile', async () => {
  const { sandboxEnv } = await import('../run-cell.mjs');
  const base = mkdtempSync(join(tmpdir(), 'm3sbx-'));
  const e = sandboxEnv({ APPDATA: 'C:/Users/x/AppData/Roaming', LOCALAPPDATA: 'C:/Users/x/AppData/Local', PATH: 'p' }, join(base, 'appdata'));
  assert.equal(e.APPDATA, join(base, 'appdata', 'Roaming'));
  assert.equal(e.LOCALAPPDATA, join(base, 'appdata', 'Local'));
  assert.ok(existsSync(e.APPDATA) && existsSync(e.LOCALAPPDATA));
  assert.equal(e.PATH, 'p');
});

test('sandboxEnv: TEMP and TMP get a folder of their own per run, whatever their spelling was', async () => {
  const { sandboxEnv } = await import('../run-cell.mjs');
  const base = mkdtempSync(join(tmpdir(), 'm3sbx-'));
  const e = sandboxEnv({ Temp: 'C:/Users/x/AppData/Local/Temp', tmp: 'C:/Users/x/AppData/Local/Temp', PATH: 'p' }, join(base, 'appdata'));
  assert.equal(e.TEMP, join(base, 'appdata', 'Temp'));
  assert.equal(e.TMP, e.TEMP);
  assert.ok(existsSync(e.TEMP));
  assert.deepEqual(Object.keys(e).filter(k => /^(temp|tmp)$/i.test(k)).sort(), ['TEMP', 'TMP']);
  const other = sandboxEnv({}, join(base, 'appdata2'));
  assert.notEqual(other.TEMP, e.TEMP);
});

test('copyRunScanned: files unchanged from the fixture are not copied (they are public already)', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'm3fx-'));
  const src = mkdtempSync(join(tmpdir(), 'm3src-'));
  const dst = mkdtempSync(join(tmpdir(), 'm3dst-'));
  writeFileSync(join(fixture, 'pubspec.yaml'), 'name: a\n');
  writeFileSync(join(src, 'pubspec.yaml'), 'name: a\n');
  writeFileSync(join(fixture, 'main.dart'), 'old\n');
  writeFileSync(join(src, 'main.dart'), 'new\n');
  const r = copyRunScanned(src, dst, { skipSameAs: fixture });
  assert.equal(existsSync(join(dst, 'pubspec.yaml')), false);
  assert.equal(readFileSync(join(dst, 'main.dart'), 'utf8'), 'new\n');
  assert.equal(r.unchanged, 1);
});

test('copyRunScanned: files identical to a skill asset are not copied, different ones are', () => {
  const skill = mkdtempSync(join(tmpdir(), 'm3sk-'));
  const src = mkdtempSync(join(tmpdir(), 'm3src-'));
  const dst = mkdtempSync(join(tmpdir(), 'm3dst-'));
  mkdirSync(join(skill, 'assets', 'web'), { recursive: true });
  writeFileSync(join(skill, 'assets', 'web', 'tokens.css'), ':root{--a:1}\n');
  mkdirSync(join(src, 'public'), { recursive: true });
  writeFileSync(join(src, 'public', 'tokens.css'), ':root{--a:1}\n');
  writeFileSync(join(src, 'public', 'other.css'), ':root{--a:2}\n');
  const r = copyRunScanned(src, dst, { skipAssetsOf: skill });
  assert.equal(existsSync(join(dst, 'public', 'tokens.css')), false);
  assert.equal(readFileSync(join(dst, 'public', 'other.css'), 'utf8'), ':root{--a:2}\n');
  assert.equal(r.unchanged, 1);
});

test('runCell: a session that ends in an error keeps the error text, so the pipeline can tell a quota stop', async () => {
  const { base, fixture, tokenFile } = setup();
  const limit = { type: 'result', is_error: true, result: 'Claude AI usage limit reached|1794600000', duration_ms: 10, total_cost_usd: 0, usage: {} };
  const r = await runCell({
    cell: { cell: 'q', request: 'settings', platform: 'web', fixture: 'web-empty', variant: 'default' },
    runId: 't6', root, evalRoot: join(base, 'eval'), fixtureDir: fixture, privateDir: join(base, 'private'),
    tokenFile, claudeCmd: fakeClaude(base, [init, limit]), repoRoot: root, realCfg: join(base, 'no'), requireFrozen: false, skipPreflightAncestors: true, requireSecretsAcl: false,
  });
  assert.equal(r.status, 'session-error');
  assert.match(r.resultText, /usage limit reached/);
});

// ---- With-skill run mode (Phase 3, Task 2) ----

const winOnly = { skip: process.platform !== 'win32' && 'Windows-only runner' };

test('buildPrompt: a skill run starts with /material3 and is otherwise the same prompt', () => {
  const cell = { request: 'podcast-player', platform: 'web', fixture: 'web-empty', variant: 'default', set: 'dev' };
  const plain = buildPrompt(cell, root);
  const skill = buildPrompt(cell, root, { skill: true });
  assert.ok(skill.startsWith('/material3 '), skill.slice(0, 40));
  assert.equal(skill, `/material3 ${plain}`);
  assert.ok(!plain.startsWith('/'), 'a baseline prompt has no slash command');
});

// gitignore-style match of one pattern against a path and its parent folders (as Claude Code's
// permission matcher does): ? = one character, * = any run within one folder, [..] = a class.
const globRe = p => new RegExp(`^${p.replace(/[.+^${}()|\\]/g, c => `\\${c}`).replace(/\?/g, '[^/]').replace(/\*/g, '[^/]*')}$`, 'i');
const denied = (patterns, path) => {
  const parts = path.split('/');
  return parts.some((_, i) => patterns.some(p => globRe(p).test(parts.slice(0, i + 1).join('/'))));
};

test('settingsFor: a skill run may read the installed skill folder and nothing else new', winOnly, () => {
  const base = { repoRoot: 'C:/r/repo', realCfg: 'C:/u/.claude', secretsDir: 'C:/u/.m3-toolchain/secrets', cfgDir: 'C:/m3-eval/cfg/x' };
  const plain = settingsFor(base);
  const s = settingsFor({ ...base, skill: 'material3' });
  const cfg = '//c/m3-eval/cfg/x';
  assert.deepEqual(s.permissions.allow, [`Read(${cfg}/skills/material3/**)`]);
  assert.ok(plain.permissions.deny.includes(`Read(${cfg}/**)`), 'the baseline denies the whole config folder');
  assert.ok(!s.permissions.deny.includes(`Read(${cfg}/**)`), 'the blanket denial would also deny the skill folder (deny wins)');
  for (const t of ['Edit', 'Write']) assert.ok(s.permissions.deny.includes(`${t}(${cfg}/**)`), `${t} stays denied`);
  assert.deepEqual(s.enabledPlugins ?? {}, {});
  // Every baseline rule stays, except the blanket read denial of the run config folder.
  const kept = plain.permissions.deny.filter(r => r !== `Read(${cfg}/**)`);
  for (const r of kept) assert.ok(s.permissions.deny.includes(r), r);
  const added = s.permissions.deny.filter(r => !plain.permissions.deny.includes(r));
  assert.ok(added.length > 0);
  for (const r of added) assert.ok(r.startsWith(`Read(${cfg}/`), r);
  // The new read denials cover every config entry except skills/material3.
  const pats = added.map(r => r.slice(`Read(${cfg}/`.length, -1));
  for (const p of ['settings.json', '.credentials.json', '.claude.json', 'projects/x/s.jsonl', 'agents/a.md', 'todos',
    'skillz/x', 'skills2', 's', 'skills/other/SKILL.md', 'skills/material/SKILL.md', 'skills/material3x/SKILL.md', 'skills/SKILL.md']) {
    assert.ok(denied(pats, p), `${p} must stay unreadable`);
  }
  for (const p of ['skills/material3/SKILL.md', 'skills/material3/scripts/verify/index.mjs', 'skills/MATERIAL3/SKILL.md']) {
    assert.ok(!denied(pats, p), `${p} must be readable`);
  }
});

test('withoutNode: drops every PATH folder holding node or node.exe, keeps the rest in order', winOnly, async () => {
  const { withoutNode } = await import('../run-cell.mjs');
  const base = mkdtempSync(join(tmpdir(), 'm3node-'));
  const [a, b, c, d] = ['a', 'b c', 'c', 'd'].map(n => { const p = join(base, n); mkdirSync(p); return p; });
  writeFileSync(join(b, 'node.exe'), '');
  writeFileSync(join(d, 'node'), '');
  writeFileSync(join(c, 'nodemon.cmd'), '');
  const e = withoutNode({ Path: [a, b, '', c, d, join(base, 'missing')].join(';'), KEEP: '1' });
  assert.deepEqual(e.Path.split(';').filter(Boolean), [a, c, join(base, 'missing')]);
  assert.equal(e.KEEP, '1');
});

test('withoutNode: also drops folders holding another JS runtime (bun, deno) or a node shim', winOnly, async () => {
  const { withoutNode } = await import('../run-cell.mjs');
  const base = mkdtempSync(join(tmpdir(), 'm3rt-'));
  const dirs = ['bun', 'deno', 'shim', 'bat', 'keep'].map(n => { const p = join(base, n); mkdirSync(p); return p; });
  writeFileSync(join(dirs[0], 'bun.exe'), '');
  writeFileSync(join(dirs[1], 'deno.exe'), '');
  writeFileSync(join(dirs[2], 'node.cmd'), '');
  writeFileSync(join(dirs[3], 'node.bat'), '');
  writeFileSync(join(dirs[4], 'bunyan.cmd'), '');
  const e = withoutNode({ PATH: dirs.join(';') });
  assert.deepEqual(e.PATH.split(';').filter(Boolean), [dirs[4]]);
});

// A stand-in for `claude` that records what it was started with into its cwd, then prints events.
function dumpingClaude(dir, events) {
  const f = join(dir, 'dump-claude.mjs');
  writeFileSync(f, [
    "import { writeFileSync, existsSync } from 'node:fs';",
    "import { join } from 'node:path';",
    "const key = Object.keys(process.env).find(k => k.toLowerCase() === 'path');",
    "writeFileSync('dump.json', JSON.stringify({ argv: process.argv.slice(2), path: process.env[key],",
    "  skill: existsSync(join(process.env.CLAUDE_CONFIG_DIR, 'skills', 'material3', 'SKILL.md')) }));",
    `for (const e of ${JSON.stringify(events)}.map(e => JSON.parse(JSON.stringify(e).replaceAll('$CFG', JSON.stringify(process.env.CLAUDE_CONFIG_DIR).slice(1, -1))))) {`,
    "  if (e.type === 'system') { e.cwd = process.cwd(); e.memory_paths = { auto: process.env.CLAUDE_CONFIG_DIR + '/projects/m' }; }",
    "  process.stdout.write(JSON.stringify(e) + '\\n');",
    '}',
  ].join('\n'));
  return [process.execPath, f];
}

function stubSkill(base) {
  const d = join(base, 'skill src', 'material3');
  mkdirSync(join(d, 'scripts'), { recursive: true });
  writeFileSync(join(d, 'SKILL.md'), '---\nname: material3\ndescription: stub\ndisable-model-invocation: true\n---\n\nReply OK.\n');
  writeFileSync(join(d, 'scripts', 'x.mjs'), '// x\n');
  return d;
}

const devCell = { cell: 'podcast-player.web.web-empty.default', request: 'podcast-player', platform: 'web', fixture: 'web-empty', variant: 'default', set: 'dev' };
const skillInit = { ...init, skills: ['material3'], slash_commands: ['material3'] };
const wrote = { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: 'index.html' } }] } };
const dumpOf = (base, runId) => JSON.parse(readFileSync(join(base, 'private', runId, devCell.cell, 'project', 'dump.json'), 'utf8'));

test('runCell: a skill run installs the skill, sends /material3 and accepts an init that lists only material3', async () => {
  const { base, fixture } = setup();
  const skillDir = stubSkill(base);
  // The token sits in a folder of its own: its folder is a forbidden root for the audit.
  const tokenFile = join(base, 'secrets', 'token');
  mkdirSync(dirname(tokenFile));
  writeFileSync(tokenFile, fakeToken);
  const common = { root, evalRoot: join(base, 'eval'), fixtureDir: fixture, privateDir: join(base, 'private'), tokenFile, repoRoot: root, realCfg: join(base, 'no'), requireFrozen: false, skipPreflightAncestors: true, requireSecretsAcl: false, skillDir };
  const read = p => ({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read', input: { file_path: p } }] } });
  const ok = await runCell({ ...common, cell: devCell, runId: 's1', claudeCmd: dumpingClaude(base, [skillInit, read('$CFG/skills/material3/SKILL.md'), read('$CFG/settings.json'), wrote, result]) });
  assert.equal(ok.status, 'ok', JSON.stringify(ok.checks));
  // The audit allows the installed skill folder, and only that part of the config folder. The audit
  // recognises Windows paths only (the runner is Windows-only), so on Linux the run folder's POSIX paths
  // produce no hits; isolation.test.mjs checks the same rule with Windows paths on every OS.
  if (process.platform === 'win32') {
    assert.ok(!ok.checks.audit.hits.some(h => /skills[\\/]+material3/i.test(h.path ?? '')), JSON.stringify(ok.checks.audit.hits));
    assert.ok(ok.checks.audit.hits.some(h => h.level === 'warn' && /settings\.json$/.test(h.path ?? '')), JSON.stringify(ok.checks.audit.hits));
  }
  const dump = dumpOf(base, 's1');
  assert.equal(dump.skill, true, 'the skill is installed in the run config folder');
  const prompt = dump.argv[dump.argv.indexOf('-p') + 1];
  assert.ok(prompt.startsWith('/material3 '), prompt.slice(0, 30));
  assert.ok(dump.argv.includes('Skill'), 'the Skill tool stays disallowed');
  assert.ok(!existsSync(join(base, 'eval', 'cfg', 's1')), 'the run config folder is removed afterwards');

  const extra = { ...skillInit, skills: ['material3', 'other'] };
  const bad = await runCell({ ...common, cell: devCell, runId: 's2', claudeCmd: dumpingClaude(base, [extra, wrote, result]) });
  assert.equal(bad.status, 'invalid-isolation');
  assert.ok(bad.checks.init.problems.some(p => p.includes('other')), JSON.stringify(bad.checks.init));
});

test('runCell: a baseline run of the same cell neither installs a skill nor accepts material3', async () => {
  const { base, fixture, tokenFile } = setup();
  const common = { root, evalRoot: join(base, 'eval'), fixtureDir: fixture, privateDir: join(base, 'private'), tokenFile, repoRoot: root, realCfg: join(base, 'no'), requireFrozen: false, skipPreflightAncestors: true, requireSecretsAcl: false };
  const r = await runCell({ ...common, cell: devCell, runId: 'b1', claudeCmd: dumpingClaude(base, [skillInit, wrote, result]) });
  assert.equal(r.status, 'invalid-isolation');
  const dump = dumpOf(base, 'b1');
  assert.equal(dump.skill, false);
  assert.ok(!dump.argv[dump.argv.indexOf('-p') + 1].startsWith('/'));
});

test('runCell: with noNode the child PATH has no folder holding node, and the toolchain Flutter and Java stay', winOnly, async () => {
  const { toolchainRoot } = await import('../toolchain-env.mjs');
  const { base, fixture, tokenFile } = setup();
  const r = await runCell({
    cell: devCell, runId: 'n1', root, evalRoot: join(base, 'eval'), fixtureDir: fixture, privateDir: join(base, 'private'),
    tokenFile, claudeCmd: dumpingClaude(base, [init, wrote, result]), repoRoot: root, realCfg: join(base, 'no'), requireFrozen: false,
    skipPreflightAncestors: true, requireSecretsAcl: false, noNode: true,
  });
  assert.equal(r.status, 'ok', JSON.stringify(r.checks));
  const dirs = dumpOf(base, 'n1').path.split(';').filter(Boolean);
  for (const d of dirs) assert.ok(!existsSync(join(d, 'node.exe')) && !existsSync(join(d, 'node')), `node found in ${d}`);
  const tc = toolchainRoot();
  assert.ok(dirs.includes(join(tc, 'flutter', 'bin')), 'Flutter stays');
  assert.ok(dirs.includes(join(tc, 'jdk-21', 'bin')), 'Java stays');
  assert.ok(process.env.PATH.split(';').some(d => d && existsSync(join(d, 'node.exe'))), 'the parent PATH has node, so the test means something');
});

test('runCell: a skill run refuses an eval cell unless the prompt is given explicitly', async () => {
  const { base, fixture, tokenFile } = setup();
  const skillDir = stubSkill(base);
  const evalCell = { cell: 'settings.web.web-react.default', request: 'settings', platform: 'web', fixture: 'web-empty', variant: 'default' };
  const common = { root, evalRoot: join(base, 'eval'), fixtureDir: fixture, privateDir: join(base, 'private'), tokenFile, repoRoot: root, realCfg: join(base, 'no'), requireFrozen: false, skipPreflightAncestors: true, requireSecretsAcl: false, skillDir };
  const r = await runCell({ ...common, cell: evalCell, runId: 'e1', claudeCmd: dumpingClaude(base, [skillInit, wrote, result]) });
  assert.equal(r.status, 'refused');
  assert.ok(r.problems.some(p => p.includes('eval cell with skill')));
  assert.ok(!existsSync(join(base, 'eval', 'work', 'e1')), 'nothing was prepared');
  assert.ok(!existsSync(join(base, 'private', 'e1', evalCell.cell, 'project', 'dump.json')), 'claude never started');
  // A micro-test passes its own prompt; no eval request is sent then.
  const m = await runCell({ ...common, cell: evalCell, runId: 'e2', promptOverride: '/material3 x', claudeCmd: dumpingClaude(base, [skillInit, wrote, result]) });
  assert.notEqual(m.status, 'refused');
});

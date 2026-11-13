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

test('settingsFor: denies the repo, the real config, the secrets folder and the run config', () => {
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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, mkdir, cp, writeFile } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function cleanEnv(extra = {}) {
  const env = { ...process.env };
  delete env.GUARD_FORBIDDEN_TERMS;
  delete env.GUARD_REQUIRE_TERMS;
  return { ...env, ...extra };
}

async function makeRepo() {
  const parent = join(tmpdir(), 'guard test repo');
  await mkdir(parent, { recursive: true });
  const dir = await mkdtemp(join(parent, 'r-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.invalid');
  git('config', 'user.name', 'guard test');
  git('config', 'commit.gpgsign', 'false');
  await mkdir(join(dir, 'tools'), { recursive: true });
  await cp(join(repoRoot, 'tools', 'guard'), join(dir, 'tools', 'guard'), { recursive: true });
  await cp(join(repoRoot, '.githooks'), join(dir, '.githooks'), { recursive: true });
  return { dir, git };
}

function runGuard(dir, args, env = cleanEnv()) {
  const r = spawnSync(process.execPath, ['tools/guard/check-public-diff.mjs', ...args], { cwd: dir, env, encoding: 'utf8' });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

test('cli: staged private file -> exit 1, private-path', async () => {
  const { dir, git } = await makeRepo();
  await mkdir(join(dir, 'private'), { recursive: true });
  await writeFile(join(dir, 'private', 'planted.txt'), 'planted');
  git('add', '-f', 'private/planted.txt');
  const r = runGuard(dir, ['--staged']);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /private-path/);
  assert.match(r.out, /private\/planted\.txt/);
});

test('cli: staged gitlink to nested private repo -> exit 1', async () => {
  const { dir, git } = await makeRepo();
  const priv = join(dir, 'private');
  await mkdir(priv, { recursive: true });
  const pgit = (...a) => execFileSync('git', a, { cwd: priv, stdio: 'pipe' });
  pgit('init', '-q', '-b', 'main');
  pgit('config', 'user.email', 'test@example.invalid');
  pgit('config', 'user.name', 'guard test');
  await writeFile(join(priv, 'x.txt'), 'x');
  pgit('add', 'x.txt');
  pgit('commit', '-q', '-m', 'p');
  git('add', '-f', 'private');
  const r = runGuard(dir, ['--staged']);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /private-path\s+private\s/);
  assert.match(r.out, /gitlink\s+private\s/);
});

test('cli: clean staged file -> exit 0', async () => {
  const { dir, git } = await makeRepo();
  await writeFile(join(dir, 'README.md'), 'hello');
  git('add', 'README.md');
  const r = runGuard(dir, ['--staged']);
  assert.equal(r.status, 0, r.out);
});

test('cli: works without private dir', async () => {
  const { dir, git } = await makeRepo();
  await writeFile(join(dir, 'a.md'), 'mentions secret-repo-xyz here');
  git('add', 'a.md');
  const r = runGuard(dir, ['--staged'], cleanEnv({ GUARD_FORBIDDEN_TERMS: 'secret-repo-xyz' }));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /forbidden-term/);
  assert.match(r.out, /NOTICE: private\/raw not found/);
  assert.ok(!r.out.includes('secret-repo-xyz'), 'output must not echo the term');
});

test('cli: terms required but missing -> exit 2', async () => {
  const { dir, git } = await makeRepo();
  await writeFile(join(dir, 'README.md'), 'hello');
  git('add', 'README.md');
  const r = runGuard(dir, ['--staged'], cleanEnv({ GUARD_REQUIRE_TERMS: 'true' }));
  assert.equal(r.status, 2, r.out);
});

test('cli: --range checks only files changed in range', async () => {
  const { dir, git } = await makeRepo();
  await writeFile(join(dir, 'old.png'), Buffer.from([0x89, 0]));
  git('add', '-A');
  git('commit', '-q', '-m', 'one'); // throwaway fixture repo: no hooks installed
  await mkdir(join(dir, 'docs'), { recursive: true });
  await writeFile(join(dir, 'docs', 'x.png'), Buffer.from([0x89, 0]));
  git('add', '-A');
  git('commit', '-q', '-m', 'two');
  const r = runGuard(dir, ['--range', 'HEAD~1..HEAD']);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /foreign-image\s+docs\/x\.png/);
  assert.ok(!r.out.includes('old.png'), r.out);
});

test('cli: corpus cache is used on second run', async () => {
  const { dir, git } = await makeRepo();
  await mkdir(join(dir, 'private'), { recursive: true });
  await cp(join(repoRoot, 'tools', 'guard', 'test', 'fixtures', 'raw'), join(dir, 'private', 'raw'), { recursive: true });
  await writeFile(join(dir, 'README.md'), 'hello');
  git('add', 'README.md');
  const first = runGuard(dir, ['--staged']);
  assert.equal(first.status, 0, first.out);
  assert.doesNotMatch(first.out, /corpus: cached/);
  const second = runGuard(dir, ['--staged']);
  assert.equal(second.status, 0, second.out);
  assert.match(second.out, /corpus: cached/);
});

test('cli: violation lines carry the allowlist key', async () => {
  const { dir, git } = await makeRepo();
  await mkdir(join(dir, 'private'), { recursive: true });
  await cp(join(repoRoot, 'tools', 'guard', 'test', 'fixtures', 'raw'), join(dir, 'private', 'raw'), { recursive: true });
  await writeFile(join(dir, 'k.md'), 'amber falcon drifts over quiet harbor while seven lanterns flicker beside the');
  git('add', 'k.md');
  const r = runGuard(dir, ['--staged']);
  assert.equal(r.status, 1, r.out);
  const key = r.out.match(/raw-overlap\s+k\.md\s+.*\(allowlist key: ([0-9a-f]{16})\)/)[1];
  await writeFile(join(dir, 'tools', 'guard', 'allowlist.txt'), `raw-overlap\tk.md\t${key}\treviewed in test: invented text\n`);
  assert.equal(runGuard(dir, ['--staged']).status, 0);
});

test('hook blocks without node', { skip: process.platform !== 'win32' }, async () => {
  const { dir } = await makeRepo();
  const execPath = execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim();
  const usrBin = resolve(execPath, '..', '..', '..', 'usr', 'bin');
  const r = spawnSync(join(usrBin, 'sh.exe'), ['.githooks/pre-commit'], { cwd: dir, env: { PATH: usrBin }, encoding: 'utf8' });
  assert.equal(r.status, 1, (r.stdout || '') + (r.stderr || ''));
  assert.match((r.stdout || '') + (r.stderr || ''), /node not found; commit blocked/);
});

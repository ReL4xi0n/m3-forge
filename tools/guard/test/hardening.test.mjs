import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, mkdir, cp, writeFile, rm } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { checkFiles, decodeText, isNoreplyEmail, checkCommitMeta } from '../lib.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const NOREPLY = '1+tester@users.noreply.github.com';
const TERM = 'secret-repo-xyz';

function cleanEnv(extra = {}) {
  const env = { ...process.env };
  for (const k of ['GUARD_FORBIDDEN_TERMS', 'GUARD_REQUIRE_TERMS', 'GUARD_REQUIRE_CORPUS']) delete env[k];
  return { ...env, ...extra };
}

async function makeRepo({ email = NOREPLY } = {}) {
  const parent = join(tmpdir(), 'guard test repo');
  await mkdir(parent, { recursive: true });
  const dir = await mkdtemp(join(parent, 'h-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', email);
  git('config', 'user.name', 'guard test');
  git('config', 'commit.gpgsign', 'false');
  await mkdir(join(dir, 'tools'), { recursive: true });
  await cp(join(repoRoot, 'tools', 'guard'), join(dir, 'tools', 'guard'), { recursive: true });
  await cp(join(repoRoot, '.githooks'), join(dir, '.githooks'), { recursive: true });
  // The guard and hooks run from the working tree; they are not committed (their tests contain TERM).
  await writeFile(join(dir, '.gitignore'), 'private/\ntools/\n.githooks/\n');
  return { dir, git };
}

async function addPrivate(dir, terms = [TERM]) {
  await mkdir(join(dir, 'private', 'raw'), { recursive: true });
  await writeFile(join(dir, 'private', 'guard-terms.txt'), terms.join('\n') + '\n');
}

function runGuard(dir, args, env = cleanEnv()) {
  const r = spawnSync(process.execPath, ['tools/guard/check-public-diff.mjs', ...args], { cwd: dir, env, encoding: 'utf8' });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// ---- lib ----

test('I2: UTF-16 text (LE with BOM, LE without BOM, BE with BOM) is decoded and term-checked', () => {
  const le = Buffer.from(`notes ${TERM} end`, 'utf16le');
  const be = Buffer.from(le).swap16();
  const cases = {
    'le-bom.md': Buffer.concat([Buffer.from([0xff, 0xfe]), le]),
    'le.md': le,
    'be-bom.md': Buffer.concat([Buffer.from([0xfe, 0xff]), be]),
  };
  for (const [path, content] of Object.entries(cases)) {
    assert.equal(decodeText(content), `notes ${TERM} end`, path);
    const v = checkFiles({ files: [{ path, content }], forbiddenTerms: [TERM], corpus: null });
    assert.deepEqual(v.map(x => x.rule), ['forbidden-term'], path);
  }
  assert.equal(decodeText(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52])), null);
});

test('I4: forbidden terms are matched in file paths and that is not allowlistable', () => {
  const files = [{ path: `docs/${TERM.toUpperCase()}.md`, content: Buffer.from('harmless') }];
  const allowlist = [{ rule: 'forbidden-term', path: files[0].path, key: '*', reason: 'reviewed for test' }];
  const v = checkFiles({ files, forbiddenTerms: [TERM], corpus: null, allowlist });
  assert.equal(v.length, 1);
  assert.equal(v[0].rule, 'forbidden-term');
  assert.equal(v[0].key, '-');
  assert.match(v[0].detail, /path/);
});

test('noreply email check', () => {
  for (const ok of ['174218447+ReL4xi0n@users.noreply.github.com', 'octocat@users.noreply.github.com']) assert.ok(isNoreplyEmail(ok), ok);
  for (const bad of ['someone@gmail.com', 'noreply@github.com', 'x@users.noreply.github.com.evil.example', '', 'a b@users.noreply.github.com']) {
    assert.ok(!isNoreplyEmail(bad), bad);
  }
});

test('commit metadata: non-noreply emails and terms in messages are flagged without echoing them', () => {
  const v = checkCommitMeta({
    sha: 'abcdef1234567', authorEmail: 'someone@gmail.com', committerEmail: NOREPLY, message: `fix: copy from ${TERM}`,
  }, [TERM]);
  assert.deepEqual(v.map(x => x.rule).sort(), ['commit-email', 'forbidden-term']);
  assert.ok(v.every(x => x.key === '-'));
  const text = JSON.stringify(v);
  assert.ok(!text.includes('gmail') && !text.includes(TERM), text);
});

// ---- CLI ----

test('M1: a staged type change is checked', async () => {
  const { dir, git } = await makeRepo();
  await writeFile(join(dir, 'a.md'), 'hello');
  git('add', 'a.md');
  git('commit', '-q', '-m', 'one');
  await writeFile(join(dir, 'target.txt'), `points at ${TERM}`);
  const sha = git('hash-object', '-w', 'target.txt').trim();
  await rm(join(dir, 'target.txt'));
  git('update-index', '--cacheinfo', `120000,${sha},a.md`);
  assert.match(git('diff', '--cached', '--name-status'), /^T\s+a\.md/m);
  const r = runGuard(dir, ['--staged'], cleanEnv({ GUARD_FORBIDDEN_TERMS: TERM }));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /forbidden-term\s+a\.md/);
});

for (const mode of ['--staged', '--all-tracked']) {
  test(`M2: gitlink whose commit exists locally is still flagged (${mode})`, async () => {
    const { dir, git } = await makeRepo();
    await writeFile(join(dir, 'a.md'), 'hello');
    git('add', 'a.md', '.gitignore');
    git('commit', '-q', '-m', 'one');
    const head = git('rev-parse', 'HEAD').trim();
    git('update-index', '--add', '--cacheinfo', `160000,${head},vendor/sub`);
    const r = runGuard(dir, [mode]);
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /gitlink\s+vendor\/sub/);
  });
}

test('I1: --commits checks every commit, so content added then deleted is caught', async () => {
  const { dir, git } = await makeRepo();
  await writeFile(join(dir, 'a.md'), 'base');
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  await writeFile(join(dir, 'leak.md'), `copied from ${TERM}`);
  git('add', 'leak.md');
  git('commit', '-q', '-m', 'add');
  git('rm', '-q', 'leak.md');
  git('commit', '-q', '-m', 'remove');
  const env = cleanEnv({ GUARD_FORBIDDEN_TERMS: TERM });
  assert.equal(runGuard(dir, ['--range', 'HEAD~2..HEAD'], env).status, 0, 'endpoint diff misses it');
  const r = runGuard(dir, ['--commits', 'HEAD~2..HEAD'], env);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /forbidden-term\s+[0-9a-f]{7}:leak\.md/);
});

test('I1: --commits flags terms in commit messages and non-noreply emails', async () => {
  const { dir, git } = await makeRepo({ email: 'someone@example.com' });
  await writeFile(join(dir, 'a.md'), 'base');
  git('add', '-A');
  git('commit', '-q', '-m', `chore: sync with ${TERM}`);
  const r = runGuard(dir, ['--commits', 'HEAD'], cleanEnv({ GUARD_FORBIDDEN_TERMS: TERM }));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /commit-email\s+[0-9a-f]{7}/);
  assert.match(r.out, /forbidden-term\s+[0-9a-f]{7}\s+.*commit message/);
  assert.ok(!r.out.includes('someone@example.com') && !r.out.includes(TERM), r.out);
});

test('I1: --commits passes for clean noreply history', async () => {
  const { dir, git } = await makeRepo();
  await writeFile(join(dir, 'a.md'), 'base');
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  const r = runGuard(dir, ['--commits', 'HEAD'], cleanEnv({ GUARD_FORBIDDEN_TERMS: TERM }));
  assert.equal(r.status, 0, r.out);
});

test('I3: GUARD_REQUIRE_CORPUS without private/raw -> exit 2', async () => {
  const { dir, git } = await makeRepo();
  await writeFile(join(dir, 'a.md'), 'hello');
  git('add', 'a.md');
  const r = runGuard(dir, ['--staged'], cleanEnv({ GUARD_FORBIDDEN_TERMS: TERM, GUARD_REQUIRE_CORPUS: '1' }));
  assert.equal(r.status, 2, r.out);
});

test('I3: inside a linked worktree the main checkout private/ is used', async () => {
  const { dir, git } = await makeRepo();
  await addPrivate(dir);
  await writeFile(join(dir, 'a.md'), 'hello');
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  const wt = join(dir, '..', `${dir.split(/[\\/]/).pop()}-wt`);
  git('worktree', 'add', '-q', wt, '-b', 'wt');
  await writeFile(join(wt, 'b.md'), `mentions ${TERM}`);
  execFileSync('git', ['add', 'b.md'], { cwd: wt });
  // tools/ is untracked in these fixture repos, so run the main checkout's copy with cwd = worktree.
  const s = spawnSync(process.execPath, [join(dir, 'tools', 'guard', 'check-public-diff.mjs'), '--staged'], {
    cwd: wt, env: cleanEnv({ GUARD_REQUIRE_TERMS: '1', GUARD_REQUIRE_CORPUS: '1' }), encoding: 'utf8',
  });
  const r = { status: s.status, out: (s.stdout || '') + (s.stderr || '') };
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /forbidden-term\s+b\.md/);
});

// ---- hooks ----

function shell() {
  if (process.platform !== 'win32') return { sh: 'sh', env: cleanEnv() };
  const execPath = execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim();
  const usrBin = resolve(execPath, '..', '..', '..', 'usr', 'bin');
  const env = cleanEnv();
  for (const k of Object.keys(env)) if (/^path$/i.test(k)) delete env[k];
  env.PATH = [dirname(process.execPath), execPath, usrBin].join(';');
  return { sh: join(usrBin, 'sh.exe'), env };
}

test('I3: pre-commit hook fails closed when private/ is missing', async () => {
  const { dir, git } = await makeRepo();
  await writeFile(join(dir, 'a.md'), 'hello');
  git('add', 'a.md');
  const { sh, env } = shell();
  const r = spawnSync(sh, ['.githooks/pre-commit'], { cwd: dir, env, encoding: 'utf8' });
  assert.equal(r.status, 2, (r.stdout || '') + (r.stderr || ''));
});

async function makePushPair(opts) {
  const repo = await makeRepo(opts);
  const bare = `${repo.dir}-remote.git`;
  execFileSync('git', ['init', '-q', '--bare', bare]);
  repo.git('remote', 'add', 'origin', bare);
  return repo;
}

function push(dir, ...args) {
  const r = spawnSync('git', ['-c', 'core.hooksPath=.githooks', 'push', ...args], { cwd: dir, env: cleanEnv(), encoding: 'utf8' });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

test('pre-push: clean noreply history is pushed', async () => {
  const { dir, git } = await makePushPair();
  await writeFile(join(dir, 'a.md'), 'base');
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  await addPrivate(dir);
  const r = push(dir, '-q', 'origin', 'main');
  assert.equal(r.status, 0, r.out);
});

test('pre-push: backup/* branches are never pushed', async () => {
  const { dir, git } = await makePushPair();
  await writeFile(join(dir, 'a.md'), 'base');
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  git('branch', 'backup/main-before-rewrite');
  await addPrivate(dir);
  const r = push(dir, 'origin', 'backup/main-before-rewrite');
  assert.notEqual(r.status, 0, r.out);
  assert.match(r.out, /backup-branch/);
  const r2 = push(dir, 'origin', 'main:refs/heads/backup/x');
  assert.notEqual(r2.status, 0, r2.out);
});

test('pre-push: non-noreply author email blocks the push', async () => {
  const { dir, git } = await makePushPair({ email: 'someone@example.com' });
  await writeFile(join(dir, 'a.md'), 'base');
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  await addPrivate(dir);
  const r = push(dir, 'origin', 'main');
  assert.notEqual(r.status, 0, r.out);
  assert.match(r.out, /commit-email/);
  assert.ok(!r.out.includes('someone@example.com'), r.out);
});

test('pre-push: forbidden term in a branch name blocks the push', async () => {
  const { dir, git } = await makePushPair();
  await writeFile(join(dir, 'a.md'), 'base');
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  git('branch', `feat/${TERM}`);
  await addPrivate(dir);
  const r = push(dir, 'origin', `feat/${TERM}`);
  assert.notEqual(r.status, 0, r.out);
  assert.match(r.out, /forbidden-term\s+ref /);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, mkdir, cp, writeFile, readFile, rm } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { FAST_TEST_GLOBS, fastTestEnv, prePushProblem, ACTIVE_VAR } from '../fast-tests.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const NOREPLY = '1+tester@users.noreply.github.com';
const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const ZERO = '0'.repeat(40);

test('FAST_TEST_GLOBS are the globs of the npm test script', async () => {
  const pkg = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8'));
  const globs = [...pkg.scripts.test.matchAll(/"([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(FAST_TEST_GLOBS, globs);
});

test('fastTestEnv: no toolchain tests, no browser tests, recursion marker set, rest kept', () => {
  const env = fastTestEnv({ M3_TOOLCHAIN_TESTS: '1', NODE_TEST_CONTEXT: 'child-v8', PATH: 'p', HOME: 'h' });
  assert.equal(env.M3_TOOLCHAIN_TESTS, undefined);
  assert.equal(env.NODE_TEST_CONTEXT, undefined);
  assert.equal(env.M3_NO_BROWSER_TESTS, '1');
  assert.equal(env[ACTIVE_VAR], '1');
  assert.equal(env.PATH, 'p');
  assert.equal(env.HOME, 'h');
});

test('fastTestEnv: the guard settings the hook exports do not reach the tests', () => {
  const env = fastTestEnv({ GUARD_REQUIRE_TERMS: '1', GUARD_REQUIRE_CORPUS: '1', GUARD_FORBIDDEN_TERMS: 't', PATH: 'p' });
  for (const k of ['GUARD_REQUIRE_TERMS', 'GUARD_REQUIRE_CORPUS', 'GUARD_FORBIDDEN_TERMS']) assert.equal(env[k], undefined, k);
});

test('prePushProblem: clean tree pushing HEAD passes; deletions are ignored', () => {
  const lines = [`refs/heads/x ${A} refs/heads/x ${B}`, `(delete) ${ZERO} refs/heads/old ${B}`];
  assert.equal(prePushProblem({ head: A, pushed: lines, peel: s => s, status: '' }), null);
});

test('prePushProblem: a dirty working tree blocks (tests would not run on the pushed commit)', () => {
  const p = prePushProblem({ head: A, pushed: [`refs/heads/x ${A} refs/heads/x ${B}`], peel: s => s, status: ' M tools/a.mjs\n?? tools/b.test.mjs\n' });
  assert.match(p, /working tree/);
  assert.match(p, /tools\/b\.test\.mjs/);
});

test('prePushProblem: pushing a commit other than HEAD blocks; annotated tags are peeled', () => {
  const p = prePushProblem({ head: A, pushed: [`refs/heads/y ${B} refs/heads/y ${ZERO}`], peel: s => s, status: '' });
  assert.match(p, /HEAD/);
  const tag = 'c'.repeat(40);
  assert.equal(prePushProblem({ head: A, pushed: [`refs/tags/v1 ${tag} refs/tags/v1 ${ZERO}`], peel: s => (s === tag ? A : s), status: '' }), null);
});

// ---- the hook end to end, in a throwaway repo with one tiny test file ----

async function makeRepo(testBody) {
  const parent = join(tmpdir(), 'fast tests repo');
  await mkdir(parent, { recursive: true });
  const dir = await mkdtemp(join(parent, 'r-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', NOREPLY);
  git('config', 'user.name', 'fast tests');
  git('config', 'commit.gpgsign', 'false');
  await cp(join(repoRoot, 'tools', 'guard'), join(dir, 'tools', 'guard'), { recursive: true });
  await rm(join(dir, 'tools', 'guard', 'test'), { recursive: true, force: true });
  await mkdir(join(dir, 'tools', 'ci'), { recursive: true });
  await cp(join(repoRoot, 'tools', 'ci', 'fast-tests.mjs'), join(dir, 'tools', 'ci', 'fast-tests.mjs'));
  await cp(join(repoRoot, '.githooks'), join(dir, '.githooks'), { recursive: true });
  await writeFile(join(dir, '.gitignore'), 'private/\ntools/guard/\ntools/ci/\n.githooks/\n');
  await mkdir(join(dir, 'tools', 'x', 'test'), { recursive: true });
  await writeFile(join(dir, 'tools', 'x', 'test', 'x.test.mjs'), `import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('x', () => { ${testBody} });\n`);
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  await mkdir(join(dir, 'private', 'raw'), { recursive: true });
  await writeFile(join(dir, 'private', 'guard-terms.txt'), 'secret-repo-xyz\n');
  const bare = `${dir}-remote.git`;
  execFileSync('git', ['init', '-q', '--bare', bare]);
  git('remote', 'add', 'origin', bare);
  return { dir, git };
}

function push(dir) {
  const env = { ...process.env };
  for (const k of ['GUARD_FORBIDDEN_TERMS', 'GUARD_REQUIRE_TERMS', 'GUARD_REQUIRE_CORPUS', ACTIVE_VAR, 'M3_TOOLCHAIN_TESTS']) delete env[k];
  const r = spawnSync('git', ['-c', 'core.hooksPath=.githooks', 'push', 'origin', 'main'], { cwd: dir, env, encoding: 'utf8' });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

test('pre-push: a failing fast test blocks the push', { timeout: 120_000 }, async () => {
  const { dir } = await makeRepo('assert.equal(1, 2);');
  const r = push(dir);
  assert.notEqual(r.status, 0, r.out);
  assert.match(r.out, /fast tests failed/);
});

test('pre-push: passing fast tests let the push through', { timeout: 120_000 }, async () => {
  const { dir } = await makeRepo('assert.equal(1, 1);');
  const r = push(dir);
  assert.equal(r.status, 0, r.out);
});

test('pre-push: an untracked test file blocks the push before any test runs', { timeout: 120_000 }, async () => {
  const { dir } = await makeRepo('assert.equal(1, 1);');
  await writeFile(join(dir, 'tools', 'x', 'test', 'y.test.mjs'), 'export {};\n');
  const r = push(dir);
  assert.notEqual(r.status, 0, r.out);
  assert.match(r.out, /working tree/);
});

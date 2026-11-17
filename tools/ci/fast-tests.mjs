#!/usr/bin/env node
// Fast test subset for the pre-push hook: the npm test suite without the tests that need the local
// toolchain (Flutter/Android SDK, M3_TOOLCHAIN_TESTS) or a Playwright browser (M3_NO_BROWSER_TESTS).
// With --pre-push it reads git's pre-push lines on stdin and first checks that the tests will run on
// what is pushed: a clean working tree whose HEAD is every pushed commit.
import { readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const FAST_TEST_GLOBS = ['tools/**/*.test.mjs', 'evals/tools/**/*.test.mjs', 'harness/**/*.test.mjs', 'plugin/**/*.test.mjs'];

// Set for the child test run. A test that drives the pre-push hook inside a throwaway repo inherits it,
// so the hook there runs only the guard and the suite never recurses into itself.
export const ACTIVE_VAR = 'M3_FAST_TESTS_ACTIVE';

const isZero = sha => /^0+$/.test(sha);

export function fastTestEnv(env) {
  const out = { ...env, M3_NO_BROWSER_TESTS: '1', [ACTIVE_VAR]: '1' };
  delete out.M3_TOOLCHAIN_TESTS;
  // A test runner's child (NODE_TEST_CONTEXT set) skips `node --test` files; this run is its own suite.
  delete out.NODE_TEST_CONTEXT;
  return out;
}

// pushed: "<local ref> <local sha> <remote ref> <remote sha>" lines; peel: sha -> commit sha;
// status: `git status --porcelain` output. Returns null when the tests can stand for the push.
export function prePushProblem({ head, pushed, peel, status }) {
  const dirty = status.split(/\r?\n/).filter(Boolean);
  if (dirty.length) {
    return `the working tree differs from HEAD, so the tests would not run on the pushed commit; commit or stash first:\n  ${dirty.join('\n  ')}`;
  }
  for (const line of pushed) {
    const [localRef, localSha] = line.trim().split(' ');
    if (!localSha || isZero(localSha)) continue;
    if (peel(localSha) !== head) return `${localRef} (${localSha.slice(0, 7)}) is not HEAD (${head.slice(0, 7)}); check out the commit you push`;
  }
  return null;
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function main() {
  if (process.argv.includes('--pre-push')) {
    const pushed = readFileSync(0, 'utf8').split(/\r?\n/).filter(Boolean);
    const problem = prePushProblem({
      head: git(['rev-parse', 'HEAD']).trim(),
      pushed,
      peel: sha => git(['rev-parse', `${sha}^{commit}`]).trim(),
      status: git(['status', '--porcelain']),
    });
    if (problem) {
      console.error(`m3-forge fast tests: ${problem}`);
      return 1;
    }
  }
  const started = Date.now();
  const r = spawnSync(process.execPath, ['--test', ...FAST_TEST_GLOBS], { stdio: 'inherit', env: fastTestEnv(process.env) });
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  if (r.status !== 0) {
    console.error(`m3-forge fast tests failed (${secs} s)`);
    return 1;
  }
  console.error(`m3-forge fast tests passed (${secs} s)`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
